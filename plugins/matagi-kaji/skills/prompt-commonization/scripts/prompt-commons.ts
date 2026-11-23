// プロンプト共通化スクリプト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { ParseError, ReadPhrase } from "./markdown-scan.ts";
import {
  eolOf,
  IMPORT_END_PATTERN,
  IMPORT_START_PATTERN,
  isInSync,
  LINE_BREAK_PATTERN,
  parseImportBlocks,
  phraseLinesOf,
} from "./markdown-scan.ts";

export * from "./apply.ts";
export * from "./detect.ts";
export type {
  ImportBlock,
  ParseError,
  ParseResult,
  ReadPhrase,
} from "./markdown-scan.ts";
export { parseImportBlocks } from "./markdown-scan.ts";

export type ExpandError =
  | ParseError
  | { kind: "missing-phrase"; line: number; path: string };

export type ExpandResult = {
  text: string;
  errors: ExpandError[];
};

// 各 @import ブロックの本文を共通文言の最新内容へ置き換える。
// 構文不正の入力は書き換えず、共通文言ファイルが無いブロックは未変更のままエラーにする。
export function expandBlocks(
  text: string,
  readPhrase: ReadPhrase,
): ExpandResult {
  const { blocks, errors: parseErrors } = parseImportBlocks(text);
  if (parseErrors.length > 0) {
    return { text, errors: parseErrors };
  }

  const lines = text.split(LINE_BREAK_PATTERN);
  const errors: ExpandError[] = [];

  // 後ろのブロックから置換し、前方の行番号がずれないようにする。
  for (const block of [...blocks].reverse()) {
    const phrase = readPhrase(block.path);
    if (phrase === undefined) {
      errors.push({
        kind: "missing-phrase",
        line: block.startLine,
        path: block.path,
      });
      continue;
    }
    const bodyLength = block.endLine - 1 - block.startLine;
    lines.splice(block.startLine, bodyLength, ...phraseLinesOf(phrase));
  }

  return { text: lines.join(eolOf(text)), errors: errors.reverse() };
}

export type FindingKind =
  | ParseError["kind"]
  | "stale"
  | "missing-phrase"
  | "import-in-phrase";

export type Finding = {
  kind: FindingKind;
  line: number;
  message: string;
};

const PARSE_ERROR_MESSAGES: Record<ParseError["kind"], string> = {
  unclosed: "@import に対応する @end がありません",
  "orphan-end": "対応する @import のない @end があります",
  nested: "@import ブロックの内側に別の @import があります（ネスト禁止）",
};
const IMPORT_IN_PHRASE_MESSAGE =
  "共通文言ファイルに @import / @end の単独行を含めることはできません";

function staleMessageOf(path: string): string {
  return `展開本文が共通文言 ${path} と食い違っています（expand で更新してください）`;
}

function missingPhraseMessageOf(path: string): string {
  return `共通文言ファイル ${path} が見つかりません`;
}

// プロンプト中の @import ブロックを検証する。
// 構文不正があるときは構文エラーのみ返し、食い違い・欠落の検証は行わない。
export function checkBlocks(text: string, readPhrase: ReadPhrase): Finding[] {
  const { blocks, errors } = parseImportBlocks(text);
  if (errors.length > 0) {
    return errors.map(({ kind, line }) => ({
      kind,
      line,
      message: PARSE_ERROR_MESSAGES[kind],
    }));
  }

  const findings: Finding[] = [];
  for (const block of blocks) {
    const phrase = readPhrase(block.path);
    if (phrase === undefined) {
      findings.push({
        kind: "missing-phrase",
        line: block.startLine,
        message: missingPhraseMessageOf(block.path),
      });
      continue;
    }
    if (!isInSync(block.body, phrase)) {
      findings.push({
        kind: "stale",
        line: block.startLine,
        message: staleMessageOf(block.path),
      });
    }
  }
  return findings;
}

// 共通文言ファイルに @import / @end の単独行が混入していないか検証する。
export function checkPhraseFile(content: string): Finding[] {
  const findings: Finding[] = [];
  content.split(LINE_BREAK_PATTERN).forEach((lineText, index) => {
    if (
      IMPORT_START_PATTERN.test(lineText) ||
      IMPORT_END_PATTERN.test(lineText)
    ) {
      findings.push({
        kind: "import-in-phrase",
        line: index + 1,
        message: IMPORT_IN_PHRASE_MESSAGE,
      });
    }
  });
  return findings;
}

export function formatFinding(file: string, finding: Finding): string {
  return `${file}:${finding.line}: ${finding.message}`;
}
