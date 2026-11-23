// Markdown の走査部品（frontmatter・コードフェンスの除外、@import ブロックの解析）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

export const LINE_BREAK_PATTERN = /\r?\n/;
export const IMPORT_START_PATTERN = /^\s*<!--\s+@import\s+(\S+)\s+-->\s*$/;
export const IMPORT_END_PATTERN = /^\s*<!--\s+@end\s+-->\s*$/;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const FRONTMATTER_DELIMITER = "---";
export const IMPORT_END_LINE = "<!-- @end -->";
const PATH_SEGMENT_PATTERN = /[\\/]/;
const ABSOLUTE_PATH_PATTERN = /^(?:[\\/]|[A-Za-z]:)/;
const TRAILING_LINE_BREAK_PATTERN = /\r?\n$/;
const CRLF = "\r\n";

export const LINE_FEED = "\n";
export const PATH_SEPARATOR = "/";
export const PARENT_SEGMENT = "..";
export const MARKDOWN_EXTENSION = ".md";

export type ReadFile = (path: string) => string | undefined;

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

export type ScannableLine = {
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

type BodyScan = {
  scannable: ScannableLine[];
  unclosedFenceLine: number | undefined;
};

function scanBody(lines: string[]): BodyScan {
  const scannable: ScannableLine[] = [];
  const firstBodyIndex = firstBodyIndexOf(lines);
  let openFence: string | null = null;
  let openFenceLine: number | undefined;

  for (let index = firstBodyIndex; index < lines.length; index++) {
    const text = lines[index] ?? "";
    const marker = FENCE_PATTERN.exec(text)?.[1];

    if (openFence !== null) {
      if (marker !== undefined && closesFence(openFence, marker)) {
        openFence = null;
        openFenceLine = undefined;
      }
      continue;
    }
    if (marker !== undefined) {
      openFence = marker;
      openFenceLine = index + 1;
      continue;
    }
    scannable.push({ lineNumber: index + 1, text });
  }
  return { scannable, unclosedFenceLine: openFenceLine };
}

// frontmatter・コードフェンス（フェンス行を含む）を除いた走査対象行を返す。
export function scannableLinesOf(lines: string[]): ScannableLine[] {
  return scanBody(lines).scannable;
}

// 閉じていないコードフェンスがあれば、その開始行の行番号（1 始まり）を返す。
export function unclosedFenceLineOf(lines: string[]): number | undefined {
  return scanBody(lines).unclosedFenceLine;
}

// 先頭行が frontmatter の区切り（---）か。閉じていなくても真（本文が走査対象外になるため）。
export function startsWithFrontmatter(lines: string[]): boolean {
  return lines[0]?.trimEnd() === FRONTMATTER_DELIMITER;
}

// 共通文言のパスが対象リポジトリのルート相対か（絶対パス・.. セグメントを含まない）。
export function isRootRelativePath(path: string): boolean {
  const isAbsolute = ABSOLUTE_PATH_PATTERN.test(path);
  const hasParentSegment = path
    .split(PATH_SEGMENT_PATTERN)
    .includes(PARENT_SEGMENT);
  return !isAbsolute && !hasParentSegment;
}

// @import ブロックの開始行・終了行（走査用の正規表現と対になる生成側）。
export function importStartLineOf(path: string): string {
  return `<!-- @import ${path} -->`;
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
      body: lines.slice(openBlock.startLine, lineNumber - 1).join(LINE_FEED),
    });
    openBlock = null;
  }

  if (openBlock !== null) {
    errors.push({ kind: "unclosed", line: openBlock.startLine });
  }
  return { blocks, errors };
}

// 入力の改行コードを保つため、CRLF を含む入力は CRLF、それ以外は LF とみなす。
export function eolOf(text: string): string {
  return text.includes(CRLF) ? CRLF : LINE_FEED;
}

// 共通文言ファイルの内容を本文行へ。末尾の改行 1 つは本文に含めない。
export function phraseLinesOf(phrase: string): string[] {
  return phrase
    .replace(TRAILING_LINE_BREAK_PATTERN, "")
    .split(LINE_BREAK_PATTERN);
}

// 展開本文が共通文言の内容と一致するか。末尾改行・改行コードの差は無視する。
export function isInSync(body: string, phrase: string): boolean {
  return phraseLinesOf(phrase).join(LINE_FEED) === body;
}

export type LineRangeReplacement = {
  startLine: number;
  endLine: number;
  lines: string[];
};

// 行範囲（1 始まり・両端含む）を置き換える。後ろの範囲から置換し、前方の行番号がずれないようにする。
// 範囲どうしは重ならないこと。endLine = startLine - 1 の範囲は空範囲（挿入）。改行コードは入力のものを保つ。
export function replaceLineRanges(
  source: string,
  replacements: LineRangeReplacement[],
): string {
  const lines = source.split(LINE_BREAK_PATTERN);
  const fromBottom = [...replacements].sort(
    (a, b) => b.startLine - a.startLine,
  );
  for (const { startLine, endLine, lines: replacementLines } of fromBottom) {
    lines.splice(startLine - 1, endLine - startLine + 1, ...replacementLines);
  }
  return lines.join(eolOf(source));
}
