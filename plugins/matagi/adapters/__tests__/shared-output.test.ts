// Run: vitest run (plugins/matagi/ 配下)
// shared.ts の出力パス検証 (assertReplaceableOutput) と一時ファイル経由の置換 (writeFileReplacing) の単体テスト。

import {
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { assertReplaceableOutput, writeFileReplacing } from "../shared.ts";
import { makeTempDir } from "./helpers/tempDir.ts";

test("assertReplaceableOutput: 存在しないパスは例外を投げない", () => {
  const dir = makeTempDir();

  expect(() => assertReplaceableOutput(join(dir, "none.toml"))).not.toThrow();
});

test("assertReplaceableOutput: 通常ファイルは例外を投げない", () => {
  const file = join(makeTempDir(), "a.toml");
  writeFileSync(file, "x");

  expect(() => assertReplaceableOutput(file)).not.toThrow();
});

test("assertReplaceableOutput: symlink（リンク先が実在しない場合も）は例外を投げない", () => {
  const dir = makeTempDir();
  const target = join(dir, "target.toml");
  writeFileSync(target, "x");
  symlinkSync(target, join(dir, "ok-link"));
  symlinkSync(join(dir, "missing"), join(dir, "dangling-link"));

  expect(() => assertReplaceableOutput(join(dir, "ok-link"))).not.toThrow();
  expect(() =>
    assertReplaceableOutput(join(dir, "dangling-link")),
  ).not.toThrow();
});

test("assertReplaceableOutput: ディレクトリはパス入りの Error にする", () => {
  const dir = makeTempDir();
  const sub = join(dir, "sub");
  mkdirSync(sub);

  expect(() => assertReplaceableOutput(sub)).toThrow(
    new RegExp(`置換できません.*${sub}`),
  );
});

test("assertReplaceableOutput: ディレクトリへの symlink は symlink として扱い例外を投げない", () => {
  const dir = makeTempDir();
  mkdirSync(join(dir, "real"));
  symlinkSync(join(dir, "real"), join(dir, "dirlink"), "dir");

  expect(() => assertReplaceableOutput(join(dir, "dirlink"))).not.toThrow();
});

test("writeFileReplacing: 存在しないパスに新規作成し .tmp を残さない", () => {
  const dir = makeTempDir();
  const path = join(dir, "new.toml");

  writeFileReplacing(path, "content\n");

  expect(readFileSync(path, "utf-8")).toBe("content\n");
  expect(readdirSync(dir)).toEqual(["new.toml"]);
});

test("writeFileReplacing: 既存の通常ファイルを置換する", () => {
  const dir = makeTempDir();
  const path = join(dir, "a.toml");
  writeFileSync(path, "old\n");

  writeFileReplacing(path, "new\n");

  expect(readFileSync(path, "utf-8")).toBe("new\n");
  expect(readdirSync(dir)).toEqual(["a.toml"]);
});

test("writeFileReplacing: symlink はリンク先を変更せず通常ファイルに置換する", () => {
  const dir = makeTempDir();
  const target = join(dir, "target.txt");
  writeFileSync(target, "target\n");
  const path = join(dir, "link.toml");
  symlinkSync(target, path);

  writeFileReplacing(path, "new\n");

  expect(readFileSync(target, "utf-8")).toBe("target\n");
  expect(lstatSync(path).isSymbolicLink()).toBe(false);
  expect(readFileSync(path, "utf-8")).toBe("new\n");
});

test("writeFileReplacing: ハードリンクはもう一方の内容と inode を変更せず別 inode に置換する", () => {
  const dir = makeTempDir();
  const other = join(dir, "other.txt");
  writeFileSync(other, "other\n");
  const path = join(dir, "hard.toml");
  linkSync(other, path);
  const inode = statSync(other).ino;

  writeFileReplacing(path, "new\n");

  expect(readFileSync(other, "utf-8")).toBe("other\n");
  expect(statSync(other).ino).toBe(inode);
  expect(statSync(path).ino).not.toBe(inode);
});

test("writeFileReplacing: 置換不能（出力パスがディレクトリ）で失敗しても .tmp を残さず既存を変えない", () => {
  const dir = makeTempDir();
  const path = join(dir, "dir.toml");
  mkdirSync(path);
  writeFileSync(join(path, "keep.txt"), "keep\n");

  expect(() => writeFileReplacing(path, "new\n")).toThrow();

  expect(readdirSync(dir)).toEqual(["dir.toml"]);
  expect(readdirSync(path)).toEqual(["keep.txt"]);
});

test("writeFileReplacing: 親ディレクトリが存在せず失敗しても例外を伝播し何も作らない", () => {
  const dir = makeTempDir();

  expect(() => writeFileReplacing(join(dir, "no-such", "a.toml"), "x")).toThrow(
    /ENOENT/,
  );

  expect(readdirSync(dir)).toEqual([]);
});
