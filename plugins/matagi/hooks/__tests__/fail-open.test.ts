// Run: vitest run (plugins/matagi/ 配下)
// fail-open.ts の stderr 1行メッセージ整形（純関数）と出力の検証。

import { afterEach, expect, test, vi } from "vitest";
import {
  FAIL_OPEN_MAX_DETAIL_LENGTH,
  FAIL_OPEN_PREFIX,
  formatFailOpenMessage,
  reportFailOpen,
} from "../fail-open.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

test("formatFailOpenMessage: プレフィックス付きで末尾が改行1つの1行になる", () => {
  const message = formatFailOpenMessage(new Error("boom"));

  expect(message).toBe(`${FAIL_OPEN_PREFIX}boom\n`);
});

test("formatFailOpenMessage: 改行・連続空白・タブを1個の半角スペースに畳み前後を trim する", () => {
  const message = formatFailOpenMessage(
    new Error("  line1\nline2\r\n\t line3   end \n"),
  );

  expect(message).toBe(`${FAIL_OPEN_PREFIX}line1 line2 line3 end\n`);
  expect(message.slice(0, -1)).not.toMatch(/[\r\n]/);
});

test("formatFailOpenMessage: 上限ちょうどの長さは切り詰めない", () => {
  const detail = "a".repeat(FAIL_OPEN_MAX_DETAIL_LENGTH);

  const message = formatFailOpenMessage(new Error(detail));

  expect(message).toBe(`${FAIL_OPEN_PREFIX}${detail}\n`);
});

test("formatFailOpenMessage: 上限超過は上限文字数で切り詰めて … を付ける", () => {
  const detail = "b".repeat(FAIL_OPEN_MAX_DETAIL_LENGTH + 100);

  const message = formatFailOpenMessage(new Error(detail));

  expect(message).toBe(
    `${FAIL_OPEN_PREFIX}${"b".repeat(FAIL_OPEN_MAX_DETAIL_LENGTH)}…\n`,
  );
});

test("formatFailOpenMessage: Error 以外の文字列も整形する", () => {
  expect(formatFailOpenMessage("plain\nstring")).toBe(
    `${FAIL_OPEN_PREFIX}plain string\n`,
  );
});

test("formatFailOpenMessage: Error 以外のオブジェクトも String() で整形する", () => {
  const thrown = { toString: () => "custom\nobject" };

  expect(formatFailOpenMessage(thrown)).toBe(
    `${FAIL_OPEN_PREFIX}custom object\n`,
  );
  expect(formatFailOpenMessage({})).toBe(
    `${FAIL_OPEN_PREFIX}[object Object]\n`,
  );
});

test("reportFailOpen: 整形結果を write にちょうど1回渡す", () => {
  const write = vi.fn();

  reportFailOpen(new Error("oops"), write);

  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith(`${FAIL_OPEN_PREFIX}oops\n`);
});

test("reportFailOpen: write が throw しても例外を伝播させない", () => {
  const write = vi.fn(() => {
    throw new Error("stderr closed");
  });

  expect(() => reportFailOpen(new Error("oops"), write)).not.toThrow();
  expect(write).toHaveBeenCalledTimes(1);
});

test("reportFailOpen: write 省略時は process.stderr.write に整形結果を渡す", () => {
  const spy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

  reportFailOpen(new Error("default"));

  expect(spy).toHaveBeenCalledWith(`${FAIL_OPEN_PREFIX}default\n`);
});
