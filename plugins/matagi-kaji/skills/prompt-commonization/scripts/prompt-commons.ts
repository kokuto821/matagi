// プロンプト共通化スクリプト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

const LINE_BREAK_PATTERN = /\r?\n/;
const IMPORT_START_PATTERN = /^\s*<!--\s+@import\s+(\S+)\s+-->\s*$/;
const IMPORT_END_PATTERN = /^\s*<!--\s+@end\s+-->\s*$/;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const FRONTMATTER_DELIMITER = "---";
const BODY_JOINER = "\n";
const TRAILING_LINE_BREAK_PATTERN = /\r?\n$/;
const CRLF = "\r\n";
const LF = "\n";

export type ImportBlock = {
  path: string;
  startLine: number;
  endLine: number;
  body: string;
};

export type ParseError = {
  kind: "unclosed" | "orphan-end" | "nested";
  line: number;
};

export type ParseResult = {
  blocks: ImportBlock[];
  errors: ParseError[];
};

export type ExpandError =
  | ParseError
  | { kind: "missing-phrase"; line: number; path: string };

export type ExpandResult = {
  text: string;
  errors: ExpandError[];
};

export type ReadPhrase = (path: string) => string | undefined;

type ScannableLine = {
  lineNumber: number;
  text: string;
};

type OpenBlock = {
  path: string;
  startLine: number;
};

// 閉じフェンスは開きフェンスと同じ文字で、同じ長さ以上であること。
function closesFence(openFence: string, marker: string): boolean {
  return marker[0] === openFence[0] && marker.length >= openFence.length;
}

// frontmatter を除いた本文の開始インデックス。閉じていない frontmatter は末尾まで走査対象外。
function firstBodyIndexOf(lines: string[]): number {
  if (lines[0]?.trimEnd() !== FRONTMATTER_DELIMITER) {
    return 0;
  }
  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trimEnd() === FRONTMATTER_DELIMITER,
  );
  return closingIndex === -1 ? lines.length : closingIndex + 1;
}

// frontmatter・コードフェンス（フェンス行を含む）を除いた走査対象行を返す。
function scannableLinesOf(lines: string[]): ScannableLine[] {
  const result: ScannableLine[] = [];
  const firstBodyIndex = firstBodyIndexOf(lines);
  let openFence: string | null = null;

  for (let index = firstBodyIndex; index < lines.length; index++) {
    const text = lines[index] ?? "";
    const marker = FENCE_PATTERN.exec(text)?.[1];

    if (openFence !== null) {
      if (marker !== undefined && closesFence(openFence, marker)) {
        openFence = null;
      }
      continue;
    }
    if (marker !== undefined) {
      openFence = marker;
      continue;
    }
    result.push({ lineNumber: index + 1, text });
  }
  return result;
}

export function parseImportBlocks(text: string): ParseResult {
  const lines = text.split(LINE_BREAK_PATTERN);
  const blocks: ImportBlock[] = [];
  const errors: ParseError[] = [];
  let openBlock: OpenBlock | null = null;

  for (const { lineNumber, text: lineText } of scannableLinesOf(lines)) {
    const startPath = IMPORT_START_PATTERN.exec(lineText)?.[1];

    if (startPath !== undefined) {
      if (openBlock !== null) {
        errors.push({ kind: "nested", line: lineNumber });
        continue;
      }
      openBlock = { path: startPath, startLine: lineNumber };
      continue;
    }

    if (!IMPORT_END_PATTERN.test(lineText)) {
      continue;
    }
    if (openBlock === null) {
      errors.push({ kind: "orphan-end", line: lineNumber });
      continue;
    }
    blocks.push({
      path: openBlock.path,
      startLine: openBlock.startLine,
      endLine: lineNumber,
      body: lines.slice(openBlock.startLine, lineNumber - 1).join(BODY_JOINER),
    });
    openBlock = null;
  }

  if (openBlock !== null) {
    errors.push({ kind: "unclosed", line: openBlock.startLine });
  }
  return { blocks, errors };
}

// 入力の改行コードを保つため、CRLF を含む入力は CRLF、それ以外は LF とみなす。
function eolOf(text: string): string {
  return text.includes(CRLF) ? CRLF : LF;
}

// 共通文言ファイルの内容を本文行へ。末尾の改行 1 つは本文に含めない。
function phraseLinesOf(phrase: string): string[] {
  return phrase
    .replace(TRAILING_LINE_BREAK_PATTERN, "")
    .split(LINE_BREAK_PATTERN);
}

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
