// 展開ブロックを共通文言の最新内容へ更新する（ファイル I/O なし）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { checkPhraseFile } from "./check.ts";
import type { Finding, PhraseFailureKind } from "./findings.ts";
import { findingOfParseError, findingOfPhraseFailure } from "./findings.ts";
import type {
  LineRangeReplacement,
  ParseError,
  ReadFile,
} from "./markdown-scan.ts";
import {
  isRootRelativePath,
  parseImportBlocks,
  phraseLinesOf,
  replaceLineRanges,
} from "./markdown-scan.ts";

export type ExpandError =
  | ParseError
  | { kind: PhraseFailureKind; line: number; path: string };

export type ExpandResult = {
  text: string;
  errors: ExpandError[];
};

// 展開に使える共通文言ファイルの内容を読む。使えない理由は kind で返す。
function loadPhrase(
  path: string,
  readPhrase: ReadFile,
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
export function expandBlocks(text: string, readPhrase: ReadFile): ExpandResult {
  const { blocks, errors: parseErrors } = parseImportBlocks(text);
  if (parseErrors.length > 0) {
    return { text, errors: parseErrors };
  }

  const errors: ExpandError[] = [];
  const replacements: LineRangeReplacement[] = [];

  for (const block of blocks) {
    const loaded = loadPhrase(block.path, readPhrase);
    if ("kind" in loaded) {
      errors.push({
        kind: loaded.kind,
        line: block.startLine,
        path: block.path,
      });
      continue;
    }
    replacements.push({
      startLine: block.startLine + 1,
      endLine: block.endLine - 1,
      lines: phraseLinesOf(loaded.content),
    });
  }

  return { text: replaceLineRanges(text, replacements), errors };
}

export function findingOfExpandError(error: ExpandError): Finding {
  return "path" in error
    ? findingOfPhraseFailure(error.kind, error.line, error.path)
    : findingOfParseError(error);
}
