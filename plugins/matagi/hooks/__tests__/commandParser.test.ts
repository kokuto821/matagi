// Run: vitest run (plugins/matagi/ 配下)
//
// command-parser.ts (tokenize / splitSegments / stripPrefix / SEGMENT_SEPARATORS) の
// ユニットテスト。

import { test, expect } from "vitest";
import { tokenize, splitSegments, stripPrefix, SEGMENT_SEPARATORS } from "../command-parser.ts";

test("空白区切りの通常コマンドをトークン列に分解する", () => {
  // Arrange
  const command = "git commit -m message";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["git", "commit", "-m", "message"]);
});

test("シングルクォート内の空白・特殊文字を1トークンとして保持する", () => {
  // Arrange
  const command = "echo 'hello world $VAR \"quoted\"'";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["echo", "hello world $VAR \"quoted\""]);
});

test("ダブルクォート内でエスケープされた文字を解決する", () => {
  // Arrange
  const command = String.raw`echo "\"\\\$\` "`;

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["echo", "\"\\$` "]);
});

test("単語先頭の#はコメント開始として以降を無視する", () => {
  // Arrange
  const command = "echo hello # this is a comment";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["echo", "hello"]);
});

test("コメントは改行までで再開しない", () => {
  // Arrange
  const command = "echo hello # comment\necho world";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["echo", "hello", "echo", "world"]);
});

test("単語途中の#はコメントとして扱わない", () => {
  // Arrange
  const command = "git commit -m fix#123";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["git", "commit", "-m", "fix#123"]);
});

test("&&を1トークンとしてまとめる", () => {
  // Arrange
  const command = "cmd1 && cmd2";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["cmd1", "&&", "cmd2"]);
});

test("||を1トークンとしてまとめる", () => {
  // Arrange
  const command = "cmd1 || cmd2";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["cmd1", "||", "cmd2"]);
});

test("&単体は2文字演算子とは区別して1文字トークンにする", () => {
  // Arrange
  const command = "cmd1 & cmd2";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["cmd1", "&", "cmd2"]);
});

test("|単体は2文字演算子とは区別して1文字トークンにする", () => {
  // Arrange
  const command = "cmd1 | cmd2";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["cmd1", "|", "cmd2"]);
});

test("区切り文字がそれぞれ独立トークンになる", () => {
  // Arrange
  const command = "cmd1;(cmd2)cmd3";

  // Act
  const result = tokenize(command);

  // Assert
  expect(result).toEqual(["cmd1", ";", "(", "cmd2", ")", "cmd3"]);
});

test("閉じていないシングルクォートは例外になる", () => {
  // Arrange
  const command = "echo 'unterminated";

  // Act & Assert
  expect(() => tokenize(command)).toThrow(/unterminated quote/);
});

test("閉じていないダブルクォートは例外になる", () => {
  // Arrange
  const command = 'echo "unterminated';

  // Act & Assert
  expect(() => tokenize(command)).toThrow(/unterminated quote/);
});

test("SEGMENT_SEPARATORSに含まれるトークンでセグメント分割される", () => {
  // Arrange
  const tokens = ["cmd1", "&&", "cmd2", ";", "cmd3"];

  // Act
  const result = splitSegments(tokens);

  // Assert
  expect(result).toEqual([["cmd1"], ["cmd2"], ["cmd3"]]);
});

test("空セグメントは結果から除外される", () => {
  // Arrange
  const tokens = ["&&", "cmd1", "&&", "&&", "cmd2"];

  // Act
  const result = splitSegments(tokens);

  // Assert
  expect(result).toEqual([["cmd1"], ["cmd2"]]);
});

test("先頭のsudoを読み飛ばす", () => {
  // Arrange
  const segment = ["sudo", "rm", "-rf", "/"];

  // Act
  const result = stripPrefix(segment);

  // Assert
  expect(result).toEqual(["rm", "-rf", "/"]);
});

test("先頭の環境変数代入を複数連続で読み飛ばす", () => {
  // Arrange
  const segment = ["FOO=bar", "BAZ=qux", "echo", "hi"];

  // Act
  const result = stripPrefix(segment);

  // Assert
  expect(result).toEqual(["echo", "hi"]);
});

test("環境変数代入でないトークンは読み飛ばさない", () => {
  // Arrange
  const segment = ["1FOO=bar", "echo", "hi"];

  // Act
  const result = stripPrefix(segment);

  // Assert
  expect(result).toEqual(["1FOO=bar", "echo", "hi"]);
});

test("該当しない場合はそのまま返す", () => {
  // Arrange
  const segment = ["git", "commit"];

  // Act
  const result = stripPrefix(segment);

  // Assert
  expect(result).toEqual(["git", "commit"]);
});

test("SEGMENT_SEPARATORSは想定した区切り文字集合を持つ", () => {
  // Arrange
  const expected = ["&&", "||", ";", "|", "&", "(", ")", "\n"];

  // Act
  const actual = [...SEGMENT_SEPARATORS];

  // Assert
  expect(actual.sort()).toEqual(expected.sort());
});
