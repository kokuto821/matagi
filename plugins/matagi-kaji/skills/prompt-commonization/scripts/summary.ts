// 共通化候補の要約（detect --out 時に標準出力へ出す、モデルの文脈に載せる量を抑えた形）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type {
  Candidate,
  CandidateKind,
  CandidateUnit,
  Occurrence,
} from "./detect.ts";

export const DEFAULT_SUMMARY_LIMIT = 30;
export const PREVIEW_MAX_CHARS = 80;

const PREVIEW_ELLIPSIS = "…";
const PREVIEW_SPACE = " ";
const WHITESPACE_RUN_PATTERN = /\s+/g;

export type SummaryOptions = {
  limit: number;
  outFile: string;
};

export type CandidateSummary = {
  id: string;
  kind: CandidateKind;
  unit: CandidateUnit;
  similarity: number;
  occurrenceCount: number;
  locations: string[];
  preview: string;
};

export type DetectSummary = {
  total: number;
  shown: number;
  truncated: boolean;
  outFile: string;
  candidates: CandidateSummary[];
};

function locationOf({ file, startLine, endLine }: Occurrence): string {
  return `${file}:${startLine}-${endLine}`;
}

// 空白の連続を 1 つに圧縮し、PREVIEW_MAX_CHARS（コードポイント単位）を超えたら切って省略記号を付ける。
function previewOf(text: string): string {
  const characters = [
    ...text.replace(WHITESPACE_RUN_PATTERN, PREVIEW_SPACE).trim(),
  ];
  return characters.length > PREVIEW_MAX_CHARS
    ? characters.slice(0, PREVIEW_MAX_CHARS).join("") + PREVIEW_ELLIPSIS
    : characters.join("");
}

function summaryOf(candidate: Candidate): CandidateSummary {
  const { id, kind, unit, similarity, occurrences } = candidate;
  return {
    id,
    kind,
    unit,
    similarity,
    occurrenceCount: occurrences.length,
    locations: occurrences.map(locationOf),
    preview: previewOf(occurrences[0]?.text ?? ""),
  };
}

// candidates の並びのまま先頭から limit 件だけを要約する。
export function summarizeCandidates(
  candidates: Candidate[],
  { limit, outFile }: SummaryOptions,
): DetectSummary {
  const shown = candidates.slice(0, limit).map(summaryOf);
  return {
    total: candidates.length,
    shown: shown.length,
    truncated: candidates.length > shown.length,
    outFile,
    candidates: shown,
  };
}
