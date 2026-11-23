// 展開ブロックを共通文言の最新内容へ更新する（ファイル I/O なし）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { Finding } from "./check.ts";
import {
  checkPhraseFile,
  invalidPathMessageOf,
  invalidPhraseMessageOf,
  missingPhraseMessageOf,
  PARSE_ERROR_MESSAGES,
} from "./check.ts";
import type { ParseError, ReadPhrase } from "./markdown-scan.ts";
import {
  eolOf,
  isRootRelativePath,
  LINE_BREAK_PATTERN,
  parseImportBlocks,
  phraseLinesOf,
} from "./markdown-scan.ts";

export type ExpandError =
  | ParseError
  | { kind: PhraseFailureKind; line: number; path: string };

export type ExpandResult = {
  text: string;
  errors: ExpandError[];
};

type PhraseFailureKind = "missing-phrase" | "invalid-phrase" | "invalid-path";

// 展開に使える共通文言ファイルの内容を読む。使えない理由は kind で返す。
function loadPhrase(
  path: string,
  readPhrase: ReadPhrase,
): { content: string } | { kind: PhraseFailureKind } {
  if (!isRootRelativePath(path)) {
    return { kind: "invalid-path" };
  }
  const content = readPhrase(path);
  if (content === undefined) {
    return { kind: "missing-phrase" };
  }
  if (checkPhraseFile(content).length > 0) {
    return { kind: "invalid-phrase" };
  }
  return { content };
}

// 各 @import ブロックの本文を共通文言の最新内容へ置き換える。
// 構文不正の入力は書き換えない。パスが不正・共通文言ファイルが無い・共通文言の内容が不正なブロックは、
// 未変更のままエラーにする。
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
    const loaded = loadPhrase(block.path, readPhrase);
    if ("kind" in loaded) {
      errors.push({
        kind: loaded.kind,
        line: block.startLine,
        path: block.path,
      });
      continue;
    }
    const phrase = loaded.content;
    const bodyLength = block.endLine - 1 - block.startLine;
    lines.splice(block.startLine, bodyLength, ...phraseLinesOf(phrase));
  }

  return { text: lines.join(eolOf(text)), errors: errors.reverse() };
}

const PHRASE_FAILURE_MESSAGES: Record<
  PhraseFailureKind,
  (path: string) => string
> = {
  "missing-phrase": missingPhraseMessageOf,
  "invalid-phrase": invalidPhraseMessageOf,
  "invalid-path": invalidPathMessageOf,
};

export function findingOfExpandError(error: ExpandError): Finding {
  if ("path" in error) {
    return {
      kind: error.kind,
      line: error.line,
      message: PHRASE_FAILURE_MESSAGES[error.kind](error.path),
    };
  }
  return {
    kind: error.kind,
    line: error.line,
    message: PARSE_ERROR_MESSAGES[error.kind],
  };
}
