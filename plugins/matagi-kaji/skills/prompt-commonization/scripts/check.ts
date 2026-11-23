// 展開ブロックの検証（食い違い・欠落・構文不正・共通文言ファイルへの混入）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { Finding } from "./findings.ts";
import { findingOfParseError, findingOfPhraseFailure } from "./findings.ts";
import type { ReadFile } from "./markdown-scan.ts";
import {
  IMPORT_END_PATTERN,
  IMPORT_START_PATTERN,
  isInSync,
  isRootRelativePath,
  LINE_BREAK_PATTERN,
  parseImportBlocks,
  scannableLinesOf,
  startsWithFrontmatter,
  unclosedFenceLineOf,
} from "./markdown-scan.ts";

const IMPORT_IN_PHRASE_MESSAGE =
  "共通文言ファイルに @import / @end の単独行を含めることはできません";

const FRONTMATTER_IN_PHRASE_MESSAGE =
  "共通文言ファイルに frontmatter を含めることはできません";
const UNCLOSED_FENCE_IN_PHRASE_MESSAGE =
  "共通文言ファイルに閉じていないコードフェンスがあります";

function staleMessageOf(path: string): string {
  return `展開本文が共通文言 ${path} と食い違っています（expand で更新してください）`;
}

// プロンプト中の @import ブロックを検証する。
// 構文不正があるときは構文エラーのみ返し、食い違い・欠落の検証は行わない。
export function checkBlocks(text: string, readPhrase: ReadFile): Finding[] {
  const { blocks, errors } = parseImportBlocks(text);
  if (errors.length > 0) {
    return errors.map(findingOfParseError);
  }

  const findings: Finding[] = [];
  for (const block of blocks) {
    if (!isRootRelativePath(block.path)) {
      findings.push(
        findingOfPhraseFailure("invalid-path", block.startLine, block.path),
      );
      continue;
    }
    const phrase = readPhrase(block.path);
    if (phrase === undefined) {
      findings.push(
        findingOfPhraseFailure("missing-phrase", block.startLine, block.path),
      );
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

// 共通文言ファイルの内容を検証する（frontmatter・@import / @end の単独行・閉じていないコードフェンス）。
// コードフェンス内の記法例は対象外。
export function checkPhraseFile(content: string): Finding[] {
  const lines = content.split(LINE_BREAK_PATTERN);
  const findings: Finding[] = [];

  if (startsWithFrontmatter(lines)) {
    findings.push({
      kind: "frontmatter-in-phrase",
      line: 1,
      message: FRONTMATTER_IN_PHRASE_MESSAGE,
    });
  }
  for (const { lineNumber, text } of scannableLinesOf(lines)) {
    if (IMPORT_START_PATTERN.test(text) || IMPORT_END_PATTERN.test(text)) {
      findings.push({
        kind: "import-in-phrase",
        line: lineNumber,
        message: IMPORT_IN_PHRASE_MESSAGE,
      });
    }
  }
  const unclosedFenceLine = unclosedFenceLineOf(lines);
  if (unclosedFenceLine !== undefined) {
    findings.push({
      kind: "unclosed-fence-in-phrase",
      line: unclosedFenceLine,
      message: UNCLOSED_FENCE_IN_PHRASE_MESSAGE,
    });
  }
  return findings.sort((a, b) => a.line - b.line);
}
