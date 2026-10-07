// Run: vitest run (plugins/matagi/ 配下)
//
// toml.ts のシリアライザ。期待値は文字列リテラルで固定する（外部 TOML パーサに依存しない）。

import { expect, test } from "vitest";
import { tomlMultilineString, tomlString } from "../toml.ts";

test("tomlString: 通常文字列を二重引用符で囲む", () => {
  expect(tomlString("abc あ")).toBe('"abc あ"');
});

test("tomlString: 空文字は空の basic string になる", () => {
  expect(tomlString("")).toBe('""');
});

test("tomlString: バックスラッシュと二重引用符をエスケープする", () => {
  expect(tomlString('a\\b"c')).toBe('"a\\\\b\\"c"');
});

test("tomlString: バックスラッシュは二重化のみされ、後続エスケープと二重処理されない", () => {
  // 入力 \n（バックスラッシュ + n の2文字）は \\n になる（改行エスケープにならない）
  expect(tomlString("\\n")).toBe('"\\\\n"');
});

test("tomlString: 改行・CR・タブ・BS・FF を短縮エスケープにする", () => {
  expect(tomlString("\n\r\t\b\f")).toBe('"\\n\\r\\t\\b\\f"');
});

test("tomlString: その他の制御文字と U+007F を \\uXXXX にする", () => {
  expect(tomlString("\u0000\u0001\u001F\u007F")).toBe(
    '"\\u0000\\u0001\\u001F\\u007F"',
  );
});

test("tomlString: 16進は大文字4桁ゼロ埋めになる", () => {
  expect(tomlString("\u000B\u001A")).toBe('"\\u000B\\u001A"');
});

test('tomlMultilineString: 先頭改行付きの """ で囲む', () => {
  expect(tomlMultilineString("line1\nline2\n")).toBe('"""\nline1\nline2\n"""');
});

test("tomlMultilineString: 空文字でも区切りが成立する", () => {
  expect(tomlMultilineString("")).toBe('"""\n"""');
});

test("tomlMultilineString: 改行とタブは生のまま残す", () => {
  expect(tomlMultilineString("a\tb\nc")).toBe('"""\na\tb\nc"""');
});

test("tomlMultilineString: バックスラッシュを二重化する", () => {
  expect(tomlMultilineString("a\\b")).toBe('"""\na\\\\b"""');
});

test("tomlMultilineString: 単独の二重引用符はそのまま残す", () => {
  expect(tomlMultilineString('say "hi" ""ok""')).toBe(
    '"""\nsay "hi" ""ok"""""',
  );
});

test('tomlMultilineString: 連続3つの二重引用符は ""\\" にする', () => {
  expect(tomlMultilineString('a"""b')).toBe('"""\na""\\"b"""');
});

test.each([
  ["単独の \\r", "a\rb", '"""\na\\rb"""'],
  ["CRLF の \\r", "a\r\nb", '"""\na\\r\nb"""'],
])("tomlMultilineString: %s をエスケープする", (_label, input, expected) => {
  expect(tomlMultilineString(input)).toBe(expected);
});

test("tomlMultilineString: 制御文字 U+0000・U+0008・U+007F を \\uXXXX / 短縮形にする", () => {
  expect(tomlMultilineString("\u0000\u0008\u000C\u007F")).toBe(
    '"""\n\\u0000\\b\\f\\u007F"""',
  );
});
