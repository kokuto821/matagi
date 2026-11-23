// 展開ブロックを共通文言の最新内容へ更新する（ファイル I/O なし）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { Finding } from "./check.ts";
import { missingPhraseMessageOf, PARSE_ERROR_MESSAGES } from "./check.ts";
import type { ParseError, ReadPhrase } from "./markdown-scan.ts";
import {
  eolOf,
  LINE_BREAK_PATTERN,
  parseImportBlocks,
  phraseLinesOf,
} from "./markdown-scan.ts";

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

export function findingOfExpandError(error: ExpandError): Finding {
  if (error.kind === "missing-phrase") {
    return {
      kind: error.kind,
      line: error.line,
      message: missingPhraseMessageOf(error.path),
    };
  }
  return {
    kind: error.kind,
    line: error.line,
    message: PARSE_ERROR_MESSAGES[error.kind],
  };
}
