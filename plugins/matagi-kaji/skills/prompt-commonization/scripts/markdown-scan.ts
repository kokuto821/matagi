// Markdown の走査部品（frontmatter・コードフェンスの除外、@import ブロックの解析）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

export const LINE_BREAK_PATTERN = /\r?\n/;
export const IMPORT_START_PATTERN = /^\s*<!--\s+@import\s+(\S+)\s+-->\s*$/;
export const IMPORT_END_PATTERN = /^\s*<!--\s+@end\s+-->\s*$/;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const FRONTMATTER_DELIMITER = "---";
export const BODY_JOINER = "\n";

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

// frontmatter・コードフェンス（フェンス行を含む）を除いた走査対象行を返す。
export function scannableLinesOf(lines: string[]): ScannableLine[] {
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
