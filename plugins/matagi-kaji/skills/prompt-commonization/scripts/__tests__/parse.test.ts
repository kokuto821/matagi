// Run: vitest run (plugins/matagi-kaji/ 配下)
//
// prompt-commons.ts の parseImportBlocks のユニットテスト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { describe, expect, test } from "vitest";
import { parseImportBlocks } from "../prompt-commons.ts";
import {
  BACKTICK_FENCE,
  BODY_LINES,
  COMMON_PATH,
  CRLF,
  END_LINE_TEXT,
  FRONTMATTER_DELIMITER,
  SECOND_BODY_LINE,
  SECOND_COMMON_PATH,
  START_LINE_TEXT,
  startLineTextOf,
  TILDE_FENCE,
  toText,
} from "./helpers.ts";

describe("parseImportBlocks", () => {
  test("単純な1ブロックを検出する（path/startLine/endLine/body、行は1始まり）", () => {
    // Arrange
    const text = [
      "# 見出し",
      "",
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      "末尾の文",
    ].join("\n");

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 3,
        endLine: 6,
        body: BODY_LINES.join("\n"),
      },
    ]);
  });

  test("複数ブロックを出現順に検出する", () => {
    // Arrange
    const text = toText([
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      "間の文",
      startLineTextOf(SECOND_COMMON_PATH),
      SECOND_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 1,
        endLine: 4,
        body: BODY_LINES.join("\n"),
      },
      {
        path: SECOND_COMMON_PATH,
        startLine: 6,
        endLine: 8,
        body: SECOND_BODY_LINE,
      },
    ]);
  });

  test("開始行・終了行の前後が空白だけの行もブロックとして検出する", () => {
    // Arrange
    const text = toText([
      `  ${START_LINE_TEXT}\t`,
      ...BODY_LINES,
      ` ${END_LINE_TEXT}  `,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 1,
        endLine: 4,
        body: BODY_LINES.join("\n"),
      },
    ]);
  });

  test.each([
    ["バッククォート", BACKTICK_FENCE],
    ["チルダ", TILDE_FENCE],
  ])("%s のコードフェンス内の @import 行は無視する", (_label, fence) => {
    // Arrange
    const text = toText([
      "説明文",
      fence,
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      fence,
      "末尾の文",
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.blocks).toStrictEqual([]);
    expect(result.errors).toStrictEqual([]);
  });

  test.each([
    ["バッククォート", BACKTICK_FENCE],
    ["チルダ", TILDE_FENCE],
  ])("%s のコードフェンスを閉じた後のブロックは検出する", (_label, fence) => {
    // Arrange
    const text = toText([
      fence,
      "例示のコード",
      fence,
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 4,
        endLine: 7,
        body: BODY_LINES.join("\n"),
      },
    ]);
  });

  test("文書先頭の frontmatter 内の @import 行は無視する", () => {
    // Arrange
    const text = toText([
      FRONTMATTER_DELIMITER,
      "name: sample",
      START_LINE_TEXT,
      END_LINE_TEXT,
      FRONTMATTER_DELIMITER,
      "本文",
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.blocks).toStrictEqual([]);
    expect(result.errors).toStrictEqual([]);
  });

  test("frontmatter を閉じた後のブロックは検出する", () => {
    // Arrange
    const text = toText([
      FRONTMATTER_DELIMITER,
      "name: sample",
      FRONTMATTER_DELIMITER,
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 4,
        endLine: 7,
        body: BODY_LINES.join("\n"),
      },
    ]);
  });

  test.each([
    ["文章の途中", `文の途中に ${START_LINE_TEXT} と書く`],
    ["開始コメントの前に文字がある行", `前置き ${START_LINE_TEXT}`],
    ["開始コメントの後に文字がある行", `${START_LINE_TEXT} 後置き`],
  ])("行中に書かれた @import（%s）はブロックにしない", (_label, inlineLine) => {
    // Arrange
    const text = toText([inlineLine, ...BODY_LINES]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.blocks).toStrictEqual([]);
    expect(result.errors).toStrictEqual([]);
  });

  test("終了行がないブロックは unclosed エラーにし、blocks に含めない", () => {
    // Arrange
    const text = toText(["# 見出し", START_LINE_TEXT, ...BODY_LINES]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.blocks).toStrictEqual([]);
    expect(result.errors).toStrictEqual([{ kind: "unclosed", line: 2 }]);
  });

  test("開始行のない終了行は orphan-end エラーにする", () => {
    // Arrange
    const text = toText(["# 見出し", ...BODY_LINES, END_LINE_TEXT]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.blocks).toStrictEqual([]);
    expect(result.errors).toStrictEqual([{ kind: "orphan-end", line: 4 }]);
  });

  test("開始の後、終了の前に別の開始があれば内側の開始行で nested エラーにする", () => {
    // Arrange
    const text = toText([
      START_LINE_TEXT,
      BODY_LINES[0],
      startLineTextOf(SECOND_COMMON_PATH),
      SECOND_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toContainEqual({ kind: "nested", line: 3 });
  });

  test("CRLF 改行の入力でも LF 入力と同じ結果になり、body に CR が残らない", () => {
    // Arrange
    const lines = [
      "# 見出し",
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      "末尾の文",
    ];
    const crlfText = toText(lines, CRLF);

    // Act
    const result = parseImportBlocks(crlfText);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 2,
        endLine: 5,
        body: BODY_LINES.join("\n"),
      },
    ]);
    expect(result.blocks[0]?.body).not.toContain("\r");
    expect(result).toStrictEqual(parseImportBlocks(toText(lines)));
  });

  test("開始行の直後が終了行の空本文ブロックは body が空文字になる", () => {
    // Arrange
    const text = toText([START_LINE_TEXT, END_LINE_TEXT]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.body).toBe("");
    expect(result.blocks[0]?.startLine).toBe(1);
    expect(result.blocks[0]?.endLine).toBe(2);
  });

  test("空入力はブロックもエラーも返さない", () => {
    // Act
    const result = parseImportBlocks("");

    // Assert
    expect(result).toStrictEqual({ blocks: [], errors: [] });
  });

  test("文書先頭以外の --- は水平線であり、frontmatter と見なさずブロックを検出する", () => {
    // Arrange
    const text = toText([
      "# 見出し",
      FRONTMATTER_DELIMITER,
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      FRONTMATTER_DELIMITER,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result.errors).toStrictEqual([]);
    expect(result.blocks).toStrictEqual([
      {
        path: COMMON_PATH,
        startLine: 3,
        endLine: 6,
        body: BODY_LINES.join("\n"),
      },
    ]);
  });

  test("閉じていない frontmatter は末尾まで走査対象外であり、ブロックもエラーも返さない", () => {
    // Arrange
    const text = toText([
      FRONTMATTER_DELIMITER,
      "title: 例",
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
    ]);

    // Act
    const result = parseImportBlocks(text);

    // Assert
    expect(result).toStrictEqual({ blocks: [], errors: [] });
  });
});
