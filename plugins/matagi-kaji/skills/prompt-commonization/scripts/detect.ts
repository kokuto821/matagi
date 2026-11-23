// 共通化候補の検出（完全一致 + 正規化後の近似一致）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { ImportBlock, ScannableLine } from "./markdown-scan.ts";
import {
  LINE_BREAK_PATTERN,
  LINE_FEED,
  parseImportBlocks,
  scannableLinesOf,
} from "./markdown-scan.ts";

export const DEFAULT_THRESHOLD = 0.8;
export const DEFAULT_MIN_CHARS = 20;

const EXACT_SIMILARITY = 1;
const MIN_CLUSTER_SIZE = 2;
const MIN_SENTENCE_COUNT = 2;
const BIGRAM_LENGTH = 2;
const NORMALIZED_SPACE = " ";
const NORMALIZATION_FORM = "NFKC";
const CANDIDATE_ID_PREFIX = "c";

// 行頭の md 記号: 箇条書き（- * +）・引用（>）・見出し（#）・番号付きリスト（1.）。
const LINE_MARKER_PATTERN = /^[ \t]*(?:[-*+>]|#{1,6}|\d+\.)[ \t]+/gm;
const INLINE_MARKER_PATTERN = /[`*_]/g;
const WHITESPACE_RUN_PATTERN = /\s+/g;
const HEADING_PATTERN = /^\s{0,3}#{1,6}(?:\s|$)/;
// 文の区切り: 。！？!? と、直後が空白のピリオド（1.5 の小数点では分割しない）。区切り文字は文に含める。
const SENTENCE_PATTERN = /\S[\s\S]*?(?:[。！？!?]|\.(?=\s)|$)/g;

export type Occurrence = {
  file: string;
  startLine: number;
  endLine: number;
  text: string;
};

export type CandidateKind = "exact" | "near";
export type CandidateUnit = "paragraph" | "sentence";

export type Candidate = {
  id: string;
  kind: CandidateKind;
  unit: CandidateUnit;
  similarity: number;
  occurrences: Occurrence[];
};

export type SourceFile = {
  file: string;
  text: string;
};

export type DetectOptions = {
  threshold?: number;
  minChars?: number;
};

type Segment = {
  startLine: number;
  endLine: number;
  text: string;
};

type Unit = {
  fileIndex: number;
  occurrence: Occurrence;
  normalized: string;
  bigrams: Set<string>;
};

type RawCandidate = {
  unit: CandidateUnit;
  kind: CandidateKind;
  similarity: number;
  members: Unit[];
};

// 比較用の正規化: NFKC → 行頭の md 記号除去 → インライン記号除去 → 空白の連続を 1 つに → trim → 小文字化。
export function normalizeText(text: string): string {
  return text
    .normalize(NORMALIZATION_FORM)
    .replace(LINE_MARKER_PATTERN, "")
    .replace(INLINE_MARKER_PATTERN, "")
    .replace(WHITESPACE_RUN_PATTERN, NORMALIZED_SPACE)
    .trim()
    .toLowerCase();
}

function bigramsOf(text: string): Set<string> {
  const bigrams = new Set<string>();
  for (let index = 0; index + BIGRAM_LENGTH <= text.length; index++) {
    bigrams.add(text.slice(index, index + BIGRAM_LENGTH));
  }
  return bigrams;
}

// bigram が両方空なら 1、片方のみ空なら 0。
function jaccardOf(first: Set<string>, second: Set<string>): number {
  if (first.size === 0 && second.size === 0) {
    return EXACT_SIMILARITY;
  }
  let common = 0;
  for (const bigram of first) {
    if (second.has(bigram)) {
      common++;
    }
  }
  return common / (first.size + second.size - common);
}

export function bigramJaccard(first: string, second: string): number {
  return jaccardOf(bigramsOf(first), bigramsOf(second));
}

function countLineBreaks(text: string): number {
  return text.split(LINE_FEED).length - 1;
}

function isInImportBlock(lineNumber: number, blocks: ImportBlock[]): boolean {
  return blocks.some(
    ({ startLine, endLine }) =>
      startLine <= lineNumber && lineNumber <= endLine,
  );
}

function isParagraphBreak(lineText: string): boolean {
  return lineText.trim() === "" || HEADING_PATTERN.test(lineText);
}

function segmentOfLines(lines: ScannableLine[]): Segment {
  return {
    startLine: lines[0]?.lineNumber ?? 0,
    endLine: lines.at(-1)?.lineNumber ?? 0,
    text: lines.map(({ text }) => text).join(LINE_FEED),
  };
}

// 空行・見出し・除外領域（frontmatter・コードフェンス・@import ブロック）で区切った段落。
function paragraphsOf(text: string): Segment[] {
  const { blocks } = parseImportBlocks(text);
  const lines = scannableLinesOf(text.split(LINE_BREAK_PATTERN)).filter(
    ({ lineNumber }) => !isInImportBlock(lineNumber, blocks),
  );
  const paragraphs: Segment[] = [];
  let current: ScannableLine[] = [];

  const flush = () => {
    if (current.length > 0) {
      paragraphs.push(segmentOfLines(current));
      current = [];
    }
  };

  for (const line of lines) {
    if (isParagraphBreak(line.text)) {
      flush();
      continue;
    }
    const previous = current.at(-1);
    if (previous !== undefined && line.lineNumber !== previous.lineNumber + 1) {
      flush();
    }
    current.push(line);
  }
  flush();
  return paragraphs;
}

function sentencesOf(paragraph: Segment): Segment[] {
  return [...paragraph.text.matchAll(SENTENCE_PATTERN)].map((match) => {
    const text = match[0].trimEnd();
    const startLine =
      paragraph.startLine +
      countLineBreaks(paragraph.text.slice(0, match.index));
    return { startLine, endLine: startLine + countLineBreaks(text), text };
  });
}

function unitOf(
  file: string,
  fileIndex: number,
  segment: Segment,
  minChars: number,
): Unit | undefined {
  const normalized = normalizeText(segment.text);
  if (normalized.length < minChars) {
    return undefined;
  }
  return {
    fileIndex,
    occurrence: { file, ...segment },
    normalized,
    bigrams: bigramsOf(normalized),
  };
}

function unitsOf(
  segments: Segment[],
  file: string,
  fileIndex: number,
  minChars: number,
): Unit[] {
  return segments.flatMap((segment) => {
    const unit = unitOf(file, fileIndex, segment, minChars);
    return unit === undefined ? [] : [unit];
  });
}

function findRoot(parents: number[], index: number): number {
  const parent = parents[index] ?? index;
  if (parent === index) {
    return index;
  }
  const root = findRoot(parents, parent);
  parents[index] = root;
  return root;
}

// 閾値以上のペアを推移的に連結し、出現 2 か所以上のクラスタのみ返す。
function clusterUnits(units: Unit[], threshold: number): Unit[][] {
  const parents = units.map((_, index) => index);
  for (let first = 0; first < units.length; first++) {
    for (let second = first + 1; second < units.length; second++) {
      const firstUnit = units[first];
      const secondUnit = units[second];
      if (
        firstUnit !== undefined &&
        secondUnit !== undefined &&
        jaccardOf(firstUnit.bigrams, secondUnit.bigrams) >= threshold
      ) {
        parents[findRoot(parents, second)] = findRoot(parents, first);
      }
    }
  }

  const clusters = new Map<number, Unit[]>();
  units.forEach((unit, index) => {
    const root = findRoot(parents, index);
    clusters.set(root, [...(clusters.get(root) ?? []), unit]);
  });
  return [...clusters.values()].filter(
    (members) => members.length >= MIN_CLUSTER_SIZE,
  );
}

function minPairSimilarityOf(members: Unit[]): number {
  let minimum = EXACT_SIMILARITY;
  members.forEach((first, index) => {
    for (const second of members.slice(index + 1)) {
      minimum = Math.min(minimum, jaccardOf(first.bigrams, second.bigrams));
    }
  });
  return minimum;
}

function rawCandidateOf(unit: CandidateUnit, members: Unit[]): RawCandidate {
  const isExact = members.every(
    ({ normalized }) => normalized === members[0]?.normalized,
  );
  return {
    unit,
    kind: isExact ? "exact" : "near",
    similarity: isExact ? EXACT_SIMILARITY : minPairSimilarityOf(members),
    members,
  };
}

function rawCandidatesOf(
  unit: CandidateUnit,
  units: Unit[],
  threshold: number,
): RawCandidate[] {
  return clusterUnits(units, threshold).map((members) =>
    rawCandidateOf(unit, members),
  );
}

function isContainedIn(inner: Occurrence, outer: Occurrence): boolean {
  return (
    inner.file === outer.file &&
    outer.startLine <= inner.startLine &&
    inner.endLine <= outer.endLine
  );
}

// 文候補の全出現が、いずれかの段落候補の出現範囲に収まるか。
function isCoveredBy(
  sentence: RawCandidate,
  paragraphs: RawCandidate[],
): boolean {
  const paragraphMembers = paragraphs.flatMap(({ members }) => members);
  return sentence.members.every((member) =>
    paragraphMembers.some(
      (paragraph) =>
        paragraph.fileIndex === member.fileIndex &&
        isContainedIn(member.occurrence, paragraph.occurrence),
    ),
  );
}

function compareByFirstMember(first: RawCandidate, second: RawCandidate) {
  const firstMember = first.members[0];
  const secondMember = second.members[0];
  if (firstMember === undefined || secondMember === undefined) {
    return 0;
  }
  return (
    firstMember.fileIndex - secondMember.fileIndex ||
    firstMember.occurrence.startLine - secondMember.occurrence.startLine
  );
}

// 共通化候補を列挙する。段落単位を優先し、段落候補に収まる文候補は出さない。
export function detectCandidates(
  files: SourceFile[],
  options: DetectOptions = {},
): Candidate[] {
  const { threshold = DEFAULT_THRESHOLD, minChars = DEFAULT_MIN_CHARS } =
    options;
  const paragraphUnits: Unit[] = [];
  const sentenceUnits: Unit[] = [];

  files.forEach(({ file, text }, fileIndex) => {
    for (const paragraph of paragraphsOf(text)) {
      paragraphUnits.push(...unitsOf([paragraph], file, fileIndex, minChars));
      const sentences = sentencesOf(paragraph);
      if (sentences.length >= MIN_SENTENCE_COUNT) {
        sentenceUnits.push(...unitsOf(sentences, file, fileIndex, minChars));
      }
    }
  });

  const paragraphCandidates = rawCandidatesOf(
    "paragraph",
    paragraphUnits,
    threshold,
  );
  const sentenceCandidates = rawCandidatesOf(
    "sentence",
    sentenceUnits,
    threshold,
  ).filter((sentence) => !isCoveredBy(sentence, paragraphCandidates));

  return [...paragraphCandidates, ...sentenceCandidates]
    .sort(compareByFirstMember)
    .map(({ unit, kind, similarity, members }, index) => ({
      id: `${CANDIDATE_ID_PREFIX}${index + 1}`,
      kind,
      unit,
      similarity,
      occurrences: members.map(({ occurrence }) => occurrence),
    }));
}
