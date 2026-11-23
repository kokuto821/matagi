// 承認済みの共通化計画から、書き込む内容を計算する（ファイル I/O なし）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { ReadPhrase } from "./markdown-scan.ts";
import {
  BODY_JOINER,
  eolOf,
  isInSync,
  LINE_BREAK_PATTERN,
  phraseLinesOf,
} from "./markdown-scan.ts";

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHRASE_FILE_EXTENSION = ".md";
const PATH_SEPARATOR = "/";
const PARENT_SEGMENT = "..";
const PHRASE_FILE_TRAILER = "\n";
const IMPORT_END_LINE = "<!-- @end -->";

export type ReadFile = ReadPhrase;

export type PlanOccurrence = {
  file: string;
  startLine: number;
  endLine: number;
  expectedText: string;
};

export type PlanPhrase = {
  name: string;
  text: string;
  occurrences: PlanOccurrence[];
};

export type Plan = {
  dir: string;
  phrases: PlanPhrase[];
};

export type PlanErrorKind =
  | "invalid-dir"
  | "invalid-name"
  | "duplicate-name"
  | "empty-text"
  | "phrase-conflict"
  | "missing-file"
  | "out-of-range"
  | "stale-plan"
  | "overlap";

export type PlanError = {
  kind: PlanErrorKind;
  message: string;
  file?: string;
  phrase?: string;
};

export type PlanWrite = {
  path: string;
  content: string;
};

export type ApplyResult = {
  writes: PlanWrite[];
  errors: PlanError[];
};

type Replacement = {
  occurrence: PlanOccurrence;
  blockLines: string[];
};

type LoadedFile = {
  file: string;
  source: string;
  replacements: Replacement[];
};

function planError(
  kind: PlanErrorKind,
  message: string,
  subject: Pick<PlanError, "file" | "phrase"> = {},
): PlanError {
  return { kind, message, ...subject };
}

function importStartLineOf(path: string): string {
  return `<!-- @import ${path} -->`;
}

function phrasePathOf(dir: string, name: string): string {
  return `${dir}${PATH_SEPARATOR}${name}${PHRASE_FILE_EXTENSION}`;
}

function phraseFileContentOf(phrase: PlanPhrase): string {
  return phrase.text + PHRASE_FILE_TRAILER;
}

function isValidDir(dir: string): boolean {
  return (
    dir !== "" &&
    !dir.startsWith(PATH_SEPARATOR) &&
    !dir.split(PATH_SEPARATOR).includes(PARENT_SEGMENT)
  );
}

// 共通文言 1 件の検証（名前・本文・既存ファイルとの競合）。既存ファイルの確認は読めるパスのときだけ行う。
function phraseErrorsOf(
  dir: string,
  phrase: PlanPhrase,
  readFile: ReadFile,
): PlanError[] {
  const { name } = phrase;
  const subject = { phrase: name };
  const errors: PlanError[] = [];

  const isValidName = KEBAB_CASE_PATTERN.test(name);
  if (!isValidName) {
    errors.push(
      planError(
        "invalid-name",
        `共通文言の名前 "${name}" が kebab-case ではありません`,
        subject,
      ),
    );
  }
  if (phrase.text.trim() === "") {
    errors.push(
      planError("empty-text", `共通文言 "${name}" の text が空です`, subject),
    );
  }
  if (!isValidName || !isValidDir(dir)) {
    return errors;
  }

  const path = phrasePathOf(dir, name);
  const existing = readFile(path);
  if (existing !== undefined && !isInSync(phrase.text, existing)) {
    errors.push(
      planError(
        "phrase-conflict",
        `共通文言ファイル ${path} が既に別の内容で存在します`,
        subject,
      ),
    );
  }
  return errors;
}

function planLevelErrorsOf(plan: Plan, readFile: ReadFile): PlanError[] {
  const errors: PlanError[] = [];
  if (!isValidDir(plan.dir)) {
    errors.push(
      planError(
        "invalid-dir",
        `共通文言の置き場 "${plan.dir}" が不正です（空・絶対パス・.. を含むパスは不可）`,
      ),
    );
  }

  const seenNames = new Set<string>();
  for (const phrase of plan.phrases) {
    if (seenNames.has(phrase.name)) {
      errors.push(
        planError(
          "duplicate-name",
          `共通文言の名前 "${phrase.name}" が計画内で重複しています`,
          { phrase: phrase.name },
        ),
      );
    }
    seenNames.add(phrase.name);
    errors.push(...phraseErrorsOf(plan.dir, phrase, readFile));
  }
  return errors;
}

// 対象ファイルごとの置換（ファイルの初出順、ファイル内は計画の記載順）。
function replacementsByFileOf(plan: Plan): Map<string, Replacement[]> {
  const byFile = new Map<string, Replacement[]>();
  for (const phrase of plan.phrases) {
    const blockLines = [
      importStartLineOf(phrasePathOf(plan.dir, phrase.name)),
      ...phraseLinesOf(phraseFileContentOf(phrase)),
      IMPORT_END_LINE,
    ];
    for (const occurrence of phrase.occurrences) {
      const replacements = byFile.get(occurrence.file) ?? [];
      replacements.push({ occurrence, blockLines });
      byFile.set(occurrence.file, replacements);
    }
  }
  return byFile;
}

function isInRange(occurrence: PlanOccurrence, lineCount: number): boolean {
  return (
    occurrence.startLine >= 1 &&
    occurrence.endLine >= occurrence.startLine &&
    occurrence.endLine <= lineCount
  );
}

function overlapErrorsOf(
  file: string,
  replacements: Replacement[],
): PlanError[] {
  const sorted = [...replacements].sort(
    (a, b) => a.occurrence.startLine - b.occurrence.startLine,
  );
  const errors: PlanError[] = [];
  let coveredUntil = 0;
  for (const { occurrence } of sorted) {
    if (occurrence.startLine <= coveredUntil) {
      errors.push(
        planError(
          "overlap",
          `${file} の行 ${occurrence.startLine}-${occurrence.endLine} が他の置換範囲と重なっています`,
          { file },
        ),
      );
    }
    coveredUntil = Math.max(coveredUntil, occurrence.endLine);
  }
  return errors;
}

// 1 ファイル分の検証（範囲・計画作成後の変更・範囲の重なり）。
function occurrenceErrorsOf(
  file: string,
  source: string,
  replacements: Replacement[],
): PlanError[] {
  const lines = source.split(LINE_BREAK_PATTERN);
  const errors: PlanError[] = [];
  const inRange: Replacement[] = [];

  for (const replacement of replacements) {
    const { occurrence } = replacement;
    const range = `行 ${occurrence.startLine}-${occurrence.endLine}`;
    if (!isInRange(occurrence, lines.length)) {
      errors.push(
        planError(
          "out-of-range",
          `${file} の${range}は範囲外です（全 ${lines.length} 行）`,
          { file },
        ),
      );
      continue;
    }
    const current = lines
      .slice(occurrence.startLine - 1, occurrence.endLine)
      .join(BODY_JOINER);
    if (current !== occurrence.expectedText) {
      errors.push(
        planError(
          "stale-plan",
          `${file} の${range}が計画作成時から変わっています`,
          { file },
        ),
      );
    }
    inRange.push(replacement);
  }
  return [...errors, ...overlapErrorsOf(file, inRange)];
}

// 後ろの範囲から置換し、前方の行番号がずれないようにする。
function replacedTextOf(source: string, replacements: Replacement[]): string {
  const lines = source.split(LINE_BREAK_PATTERN);
  const fromBottom = [...replacements].sort(
    (a, b) => b.occurrence.startLine - a.occurrence.startLine,
  );
  for (const { occurrence, blockLines } of fromBottom) {
    const rangeLength = occurrence.endLine - occurrence.startLine + 1;
    lines.splice(occurrence.startLine - 1, rangeLength, ...blockLines);
  }
  return lines.join(eolOf(source));
}

// 計画から書き込み内容を計算する。1 件でも不整合があれば writes は空。
// writes の順序: 共通文言ファイル（計画の phrases 順）→ 対象ファイル（初出順）。
export function planApply(plan: Plan, readFile: ReadFile): ApplyResult {
  const errors = planLevelErrorsOf(plan, readFile);
  const loaded: LoadedFile[] = [];

  for (const [file, replacements] of replacementsByFileOf(plan)) {
    const source = readFile(file);
    if (source === undefined) {
      errors.push(
        planError("missing-file", `対象ファイル ${file} が読めません`, {
          file,
        }),
      );
      continue;
    }
    errors.push(...occurrenceErrorsOf(file, source, replacements));
    loaded.push({ file, source, replacements });
  }
  if (errors.length > 0) {
    return { writes: [], errors };
  }

  const phraseWrites = plan.phrases.map((phrase) => ({
    path: phrasePathOf(plan.dir, phrase.name),
    content: phraseFileContentOf(phrase),
  }));
  const targetWrites = loaded.map(({ file, source, replacements }) => ({
    path: file,
    content: replacedTextOf(source, replacements),
  }));
  return { writes: [...phraseWrites, ...targetWrites], errors };
}
