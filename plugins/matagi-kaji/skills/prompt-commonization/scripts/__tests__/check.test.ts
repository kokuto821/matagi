// Run: vitest run (plugins/matagi-kaji/ 配下)
//
// prompt-commons.ts の checkBlocks / checkPhraseFile / formatFinding のユニットテスト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { describe, expect, test } from "vitest";
import {
  checkBlocks,
  checkPhraseFile,
  formatFinding,
} from "../prompt-commons.ts";
import {
  BODY_LINES,
  COMMON_PATH,
  CRLF,
  END_LINE_TEXT,
  phraseReaderOf,
  SECOND_BODY_LINE,
  SECOND_COMMON_PATH,
  SECOND_START_LINE_TEXT,
  START_LINE_TEXT,
  startLineTextOf,
  toText,
  TRAILING_NEWLINE,
} from "./helpers.ts";

const OLD_BODY_LINE = "古い本文。";
// 空でない説明文であること（中身は固定しない）。
const NON_EMPTY_MESSAGE = expect.stringMatching(/\S/);

const PHRASES = {
  [COMMON_PATH]: BODY_LINES,
  [SECOND_COMMON_PATH]: [SECOND_BODY_LINE],
};

describe("checkBlocks: 食い違い（stale）", () => {
  test("本文が共通文言と食い違うブロックを、開始コメント行の行番号つき stale にし、message に path を含める", () => {
    // Arrange
    const text = toText([
      "# 見出し",
      START_LINE_TEXT,
      OLD_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      {
        kind: "stale",
        line: 2,
        message: expect.stringContaining(COMMON_PATH),
      },
    ]);
  });

  test("本文が空のブロックも共通文言と食い違うため stale にする", () => {
    // Arrange
    const text = toText([START_LINE_TEXT, END_LINE_TEXT]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      { kind: "stale", line: 1, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("複数ブロックのうち食い違うものだけを stale にする", () => {
    // Arrange
    const text = toText([
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      "間の文",
      SECOND_START_LINE_TEXT,
      OLD_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      {
        kind: "stale",
        line: 6,
        message: expect.stringContaining(SECOND_COMMON_PATH),
      },
    ]);
  });
});

describe("formatFinding", () => {
  test("`<file>:<line>: <message>` の形式に整形する", () => {
    // Arrange
    const finding = {
      kind: "stale",
      line: 12,
      message: "共通文言と本文が食い違っています",
    };

    // Act
    const formatted = formatFinding("skills/foo/SKILL.md", finding);

    // Assert
    expect(formatted).toBe(
      "skills/foo/SKILL.md:12: 共通文言と本文が食い違っています",
    );
  });
});

describe("checkBlocks: 共通文言ファイル欠落（missing-phrase）", () => {
  test("共通文言ファイルが無いブロックを、開始コメント行の行番号つき missing-phrase にし、message に path を含める", () => {
    // Arrange
    const text = toText([
      "# 見出し",
      "",
      START_LINE_TEXT,
      OLD_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf({}));

    // Assert
    expect(findings).toStrictEqual([
      {
        kind: "missing-phrase",
        line: 3,
        message: expect.stringContaining(COMMON_PATH),
      },
    ]);
  });

  test("複数ブロックのうち共通文言ファイルが無いものだけを missing-phrase にする", () => {
    // Arrange
    const text = toText([
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      SECOND_START_LINE_TEXT,
      SECOND_BODY_LINE,
      END_LINE_TEXT,
    ]);
    const readPhrase = phraseReaderOf({ [COMMON_PATH]: BODY_LINES });

    // Act
    const findings = checkBlocks(text, readPhrase);

    // Assert
    expect(findings).toStrictEqual([
      {
        kind: "missing-phrase",
        line: 5,
        message: expect.stringContaining(SECOND_COMMON_PATH),
      },
    ]);
  });
});

describe("checkBlocks: 構文不正", () => {
  test("終了コメントの無い開始コメントを、開始コメント行の行番号つき unclosed にする", () => {
    // Arrange
    const text = toText([
      "# 見出し",
      START_LINE_TEXT,
      ...BODY_LINES,
      "末尾の文",
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      { kind: "unclosed", line: 2, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("開始コメントの無い終了コメントを、その行番号つき orphan-end にする", () => {
    // Arrange
    const text = toText(["# 見出し", ...BODY_LINES, END_LINE_TEXT]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      { kind: "orphan-end", line: 4, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("ブロック内に別の開始コメントがあるものを、内側の開始コメント行の行番号つき nested にする", () => {
    // Arrange
    const text = toText([
      START_LINE_TEXT,
      ...BODY_LINES,
      SECOND_START_LINE_TEXT,
      SECOND_BODY_LINE,
      END_LINE_TEXT,
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([
      { kind: "nested", line: 4, message: NON_EMPTY_MESSAGE },
    ]);
  });
});

describe("checkPhraseFile", () => {
  test("共通文言ファイルに @import の単独行が混入していれば、その行番号つき import-in-phrase にする", () => {
    // Arrange
    const content = toText([
      BODY_LINES[0] ?? "",
      SECOND_START_LINE_TEXT,
      BODY_LINES[1] ?? "",
    ]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "import-in-phrase", line: 2, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("共通文言ファイルに @end の単独行が混入していれば、その行番号つき import-in-phrase にする", () => {
    // Arrange
    const content = toText([...BODY_LINES, END_LINE_TEXT]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "import-in-phrase", line: 3, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("複数行の混入は、混入した行すべてを import-in-phrase にする", () => {
    // Arrange
    const content = toText([
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      SECOND_START_LINE_TEXT,
    ]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "import-in-phrase", line: 1, message: NON_EMPTY_MESSAGE },
      { kind: "import-in-phrase", line: 4, message: NON_EMPTY_MESSAGE },
      { kind: "import-in-phrase", line: 5, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("混入が無ければ空配列を返す", () => {
    // Arrange
    const content = toText(BODY_LINES) + TRAILING_NEWLINE;

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test("文中で記法に言及しているだけの行（単独行でない）は混入と見なさない", () => {
    // Arrange
    const content = toText([
      `記法は \`${START_LINE_TEXT}\` と \`${END_LINE_TEXT}\` で囲む。`,
      ...BODY_LINES,
    ]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([]);
  });
});

describe("checkBlocks: 問題なし", () => {
  test("最新に同期済みのブロックが複数あれば空配列を返す", () => {
    // Arrange
    const text = toText([
      "# 見出し",
      START_LINE_TEXT,
      ...BODY_LINES,
      END_LINE_TEXT,
      "間の文",
      SECOND_START_LINE_TEXT,
      SECOND_BODY_LINE,
      END_LINE_TEXT,
      "末尾の文",
    ]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test("ブロックが1つも無い入力は空配列を返す", () => {
    // Arrange
    const text = toText(["# 見出し", "ブロックの無い文"]);

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test("CRLF 改行の入力でも同期済みと見なして空配列を返す", () => {
    // Arrange
    const text = toText(
      [
        "# 見出し",
        START_LINE_TEXT,
        ...BODY_LINES,
        END_LINE_TEXT,
        SECOND_START_LINE_TEXT,
        SECOND_BODY_LINE,
        END_LINE_TEXT,
      ],
      CRLF,
    );

    // Act
    const findings = checkBlocks(text, phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test.each([
    ["末尾改行あり（LF）", BODY_LINES.join("\n") + "\n"],
    ["末尾改行なし", BODY_LINES.join("\n")],
    ["末尾改行あり（CRLF）", BODY_LINES.join(CRLF) + CRLF],
  ])(
    "共通文言ファイルが%sでも同期済みと見なして空配列を返す",
    (_label, phraseContent) => {
      // Arrange
      const text = toText([START_LINE_TEXT, ...BODY_LINES, END_LINE_TEXT]);
      const readPhrase = (path: string) =>
        path === COMMON_PATH ? phraseContent : undefined;

      // Act
      const findings = checkBlocks(text, readPhrase);

      // Assert
      expect(findings).toStrictEqual([]);
    },
  );

  test("空入力は空配列を返す", () => {
    // Act
    const findings = checkBlocks("", phraseReaderOf(PHRASES));

    // Assert
    expect(findings).toStrictEqual([]);
  });
});

describe("checkPhraseFile: コードフェンス・frontmatter・閉じ忘れ", () => {
  const FENCE = "```";

  test("コードフェンス内の @import / @end の記法例は import-in-phrase にしない", () => {
    // Arrange
    const content = toText([
      "記法の例:",
      FENCE,
      START_LINE_TEXT,
      END_LINE_TEXT,
      FENCE,
      ...BODY_LINES,
    ]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test("コードフェンスの外の @import は、フェンスがあっても import-in-phrase にする", () => {
    // Arrange
    const content = toText([FENCE, "コード", FENCE, START_LINE_TEXT]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "import-in-phrase", line: 4, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("先頭に frontmatter があれば、1 行目の frontmatter-in-phrase にする", () => {
    // Arrange
    const content = toText(["---", "title: x", "---", ...BODY_LINES]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "frontmatter-in-phrase", line: 1, message: NON_EMPTY_MESSAGE },
    ]);
  });

  test("先頭以外の --- は frontmatter と見なさない", () => {
    // Arrange
    const content = toText([
      BODY_LINES[0] ?? "",
      "---",
      "区切りの後の文",
      "---",
    ]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([]);
  });

  test("閉じていないコードフェンスは、開始行の unclosed-fence-in-phrase にする", () => {
    // Arrange
    const content = toText([BODY_LINES[0] ?? "", FENCE, "コード"]);

    // Act
    const findings = checkPhraseFile(content);

    // Assert
    expect(findings).toStrictEqual([
      { kind: "unclosed-fence-in-phrase", line: 2, message: NON_EMPTY_MESSAGE },
    ]);
  });
});

describe("checkBlocks: ルート外のパス（invalid-path）", () => {
  test.each([
    { label: "絶対パス", path: "/etc/passwd" },
    { label: "先頭が `..`", path: "../outside.md" },
    {
      label: "途中に `..` セグメント",
      path: "prompt-commons/../../outside.md",
    },
  ])(
    "@import のパスが不正（$label）なら共通文言ファイルを読まず invalid-path にする",
    ({ path }) => {
      // Arrange
      const text = toText([
        "# 見出し",
        startLineTextOf(path),
        "本文",
        END_LINE_TEXT,
      ]);
      const readPaths: string[] = [];

      // Act
      const findings = checkBlocks(text, (target) => {
        readPaths.push(target);
        return "本文\n";
      });

      // Assert
      expect(findings).toStrictEqual([
        { kind: "invalid-path", line: 2, message: NON_EMPTY_MESSAGE },
      ]);
      expect(readPaths).toStrictEqual([]);
    },
  );
});
