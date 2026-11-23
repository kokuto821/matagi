// Run: vitest run (plugins/matagi-kaji/ 配下)
//
// summary.ts の summarizeCandidates のユニットテスト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { describe, expect, test } from "vitest";
import type { Candidate, Occurrence } from "../prompt-commons.ts";
import {
  DEFAULT_SUMMARY_LIMIT,
  PREVIEW_MAX_CHARS,
  summarizeCandidates,
} from "../prompt-commons.ts";

const OUT_FILE = "tmp/candidates.json";
const ELLIPSIS = "…";

function occurrenceOf(overrides: Partial<Occurrence> = {}): Occurrence {
  return {
    file: "skills/a/SKILL.md",
    startLine: 3,
    endLine: 5,
    text: "共通の文。",
    ...overrides,
  };
}

function candidateOf(
  id: string,
  overrides: Partial<Candidate> = {},
): Candidate {
  return {
    id,
    kind: "exact",
    unit: "paragraph",
    similarity: 1,
    occurrences: [
      occurrenceOf(),
      occurrenceOf({ file: "agents/b.md", startLine: 7, endLine: 7 }),
    ],
    ...overrides,
  };
}

function candidatesOf(count: number): Candidate[] {
  return Array.from({ length: count }, (_, index) =>
    candidateOf(`c${index + 1}`),
  );
}

function summarize(candidates: Candidate[], limit = DEFAULT_SUMMARY_LIMIT) {
  return summarizeCandidates(candidates, { limit, outFile: OUT_FILE });
}

function previewOf(text: string): string {
  const [first] = summarize([
    candidateOf("c1", { occurrences: [occurrenceOf({ text })] }),
  ]).candidates;
  return first?.preview ?? "";
}

describe("summarizeCandidates", () => {
  test("既定の件数上限は 30", () => {
    // Assert
    expect(DEFAULT_SUMMARY_LIMIT).toBe(30);
  });

  test("候補の要約（id・kind・unit・similarity・出現数・locations・preview）を作る", () => {
    // Arrange
    const candidates = [
      candidateOf("c1", { kind: "near", unit: "sentence", similarity: 0.85 }),
    ];

    // Act
    const summary = summarize(candidates);

    // Assert
    expect(summary).toEqual({
      total: 1,
      shown: 1,
      truncated: false,
      outFile: OUT_FILE,
      candidates: [
        {
          id: "c1",
          kind: "near",
          unit: "sentence",
          similarity: 0.85,
          occurrenceCount: 2,
          locations: ["skills/a/SKILL.md:3-5", "agents/b.md:7-7"],
          preview: "共通の文。",
        },
      ],
    });
  });

  test("outFile は渡された値のまま返す", () => {
    // Act
    const summary = summarizeCandidates([], {
      limit: 1,
      outFile: "./out/../x.json",
    });

    // Assert
    expect(summary.outFile).toBe("./out/../x.json");
  });

  test("先頭から limit 件だけを渡された並びのまま載せる", () => {
    // Act
    const summary = summarize(candidatesOf(5), 3);

    // Assert
    expect(summary.candidates.map(({ id }) => id)).toEqual(["c1", "c2", "c3"]);
    expect(summary.total).toBe(5);
    expect(summary.shown).toBe(3);
  });

  test("要約に full text は含めない（text キーが出現しない）", () => {
    // Act
    const summary = summarize(candidatesOf(2));

    // Assert
    for (const candidate of summary.candidates) {
      expect(Object.keys(candidate)).not.toContain("occurrences");
    }
  });

  describe("truncated の境界", () => {
    test("候補数が limit 未満なら false", () => {
      // Act
      const summary = summarize(candidatesOf(2), 3);

      // Assert
      expect(summary.truncated).toBe(false);
      expect(summary.shown).toBe(2);
    });

    test("候補数が limit と等しければ false", () => {
      // Act
      const summary = summarize(candidatesOf(3), 3);

      // Assert
      expect(summary.truncated).toBe(false);
      expect(summary.shown).toBe(3);
    });

    test("候補数が limit を 1 つ超えれば true", () => {
      // Act
      const summary = summarize(candidatesOf(4), 3);

      // Assert
      expect(summary.truncated).toBe(true);
      expect(summary.shown).toBe(3);
      expect(summary.total).toBe(4);
    });

    test("候補が 0 件なら limit が 0 でも false", () => {
      // Act
      const summary = summarize([], 0);

      // Assert
      expect(summary).toEqual({
        total: 0,
        shown: 0,
        truncated: false,
        outFile: OUT_FILE,
        candidates: [],
      });
    });

    test("limit が 0 で候補があれば 0 件を載せて true", () => {
      // Act
      const summary = summarize(candidatesOf(2), 0);

      // Assert
      expect(summary.candidates).toEqual([]);
      expect(summary.shown).toBe(0);
      expect(summary.total).toBe(2);
      expect(summary.truncated).toBe(true);
    });
  });

  describe("preview", () => {
    test("先頭の出現の text を使う", () => {
      // Arrange
      const candidate = candidateOf("c1", {
        occurrences: [
          occurrenceOf({ text: "先頭の文。" }),
          occurrenceOf({ text: "二番目の文。" }),
        ],
      });

      // Act
      const summary = summarize([candidate]);

      // Assert
      expect(summary.candidates[0]?.preview).toBe("先頭の文。");
    });

    test("空白・改行の連続を 1 つの空白に圧縮して前後を落とす", () => {
      // Act
      const preview = previewOf("  一行目\n\n  二行目\t\t三行目  \n");

      // Assert
      expect(preview).toBe("一行目 二行目 三行目");
    });

    test("上限ちょうどの長さは切らない", () => {
      // Arrange
      const text = "あ".repeat(PREVIEW_MAX_CHARS);

      // Act
      const preview = previewOf(text);

      // Assert
      expect(preview).toBe(text);
    });

    test("上限を 1 文字超えると先頭 N 文字に … を付ける", () => {
      // Arrange
      const text = "あ".repeat(PREVIEW_MAX_CHARS + 1);

      // Act
      const preview = previewOf(text);

      // Assert
      expect(preview).toBe(`${"あ".repeat(PREVIEW_MAX_CHARS)}${ELLIPSIS}`);
    });

    test("空白圧縮後の長さ（ちょうど上限）で切り詰めを判定する", () => {
      // Arrange
      const text = `${"あ".repeat(PREVIEW_MAX_CHARS - 2)}\n\n\n\n\nい`;

      // Act
      const preview = previewOf(text);

      // Assert
      expect(preview).toBe(`${"あ".repeat(PREVIEW_MAX_CHARS - 2)} い`);
    });

    test("サロゲートペアの途中では切らない", () => {
      // Arrange
      const text = "😀".repeat(PREVIEW_MAX_CHARS + 1);

      // Act
      const preview = previewOf(text);

      // Assert
      expect(preview).toBe(`${"😀".repeat(PREVIEW_MAX_CHARS)}${ELLIPSIS}`);
    });
  });

  test("出力は JSON にしても改行を含まない", () => {
    // Arrange
    const candidate = candidateOf("c1", {
      occurrences: [occurrenceOf({ text: "一行目\n二行目" })],
    });

    // Act
    const json = JSON.stringify(summarize([candidate]));

    // Assert
    expect(json).not.toContain("\n");
  });
});
