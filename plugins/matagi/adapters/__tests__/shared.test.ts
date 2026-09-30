// Run: vitest run (plugins/matagi/ 配下)

import { test, expect } from "vitest";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertOutsideSource,
  isDirectRun,
  isInsideOrSame,
  parseOutputDirArgs,
  realpathNonStrict,
} from "../shared.ts";
import { makeTempDir } from "./helpers/tempDir.ts";

test("isDirectRun: モジュールとエントリが同一ファイルなら true", () => {
  const file = join(makeTempDir(), "entry.ts");
  writeFileSync(file, "");

  expect(isDirectRun(pathToFileURL(file).href, file)).toBe(true);
});

test("isDirectRun: エントリが別ファイルなら false", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "a.ts"), "");
  writeFileSync(join(dir, "b.ts"), "");

  expect(
    isDirectRun(pathToFileURL(join(dir, "a.ts")).href, join(dir, "b.ts")),
  ).toBe(false);
});

test("isDirectRun: エントリが symlink でも実体が同じなら true", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "real.ts"), "");
  symlinkSync(join(dir, "real.ts"), join(dir, "link.ts"));

  expect(
    isDirectRun(pathToFileURL(join(dir, "real.ts")).href, join(dir, "link.ts")),
  ).toBe(true);
});

test("isDirectRun: エントリが空文字なら false", () => {
  expect(isDirectRun(pathToFileURL(join(makeTempDir(), "a.ts")).href, "")).toBe(
    false,
  );
});

test("isDirectRun: エントリが存在しないパスなら例外を投げず false", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "a.ts"), "");

  expect(
    isDirectRun(pathToFileURL(join(dir, "a.ts")).href, join(dir, "missing.ts")),
  ).toBe(false);
});

test.each([
  ["同一パス", "/a/b", "/a/b", true],
  ["配下", "/a/b/c", "/a/b", true],
  ["深い配下", "/a/b/c/d", "/a/b", true],
  ["親", "/a", "/a/b", false],
  ["兄弟", "/a/c", "/a/b", false],
  ["前方一致するだけの兄弟", "/a/bc", "/a/b", false],
  [
    "`..foo` ディレクトリは配下ではない（root 直下の別名）",
    "/a/..foo",
    "/a",
    true,
  ],
])("isInsideOrSame: %s", (_label, target, root, expected) => {
  expect(isInsideOrSame(target, root)).toBe(expected);
});

test.each([
  ["`..`", "/a/b", "/a/b/.."],
  ["`../x`", "/a/b", "/a/b/../x"],
])("isInsideOrSame: %s を含む外側は false", (_label, root, target) => {
  // path.relative は正規化するため、root の外側を指す相対形で検証する
  expect(isInsideOrSame(target, root)).toBe(false);
});

test("realpathNonStrict: 存在するパスは realpath を返す", () => {
  const dir = makeTempDir();
  mkdirSync(join(dir, "real"));
  symlinkSync(join(dir, "real"), join(dir, "link"), "dir");

  expect(realpathNonStrict(join(dir, "link"))).toBe(join(dir, "real"));
});

test("realpathNonStrict: 未作成パスは実在する祖先を解決して残りを連結する", () => {
  const dir = makeTempDir();
  mkdirSync(join(dir, "real"));
  symlinkSync(join(dir, "real"), join(dir, "link"), "dir");

  expect(realpathNonStrict(join(dir, "link", "not", "yet"))).toBe(
    join(dir, "real", "not", "yet"),
  );
});

test("assertOutsideSource: 同一パスなら Error にする", () => {
  const root = makeTempDir();

  expect(() => assertOutsideSource(root, root)).toThrow(/ソース破壊防止/);
});

test("assertOutsideSource: 未作成の配下パスなら Error にする", () => {
  const root = makeTempDir();

  expect(() => assertOutsideSource(join(root, "a", "b"), root)).toThrow(
    /ソース破壊防止/,
  );
});

test("assertOutsideSource: ソース配下を指す symlink なら Error にする", () => {
  const root = makeTempDir();
  const other = makeTempDir();
  mkdirSync(join(root, "sub"));
  symlinkSync(join(root, "sub"), join(other, "link"), "dir");

  expect(() => assertOutsideSource(join(other, "link"), root)).toThrow(
    /ソース破壊防止/,
  );
});

test("assertOutsideSource: ソース外なら例外を投げない", () => {
  const root = makeTempDir();
  const other = makeTempDir();

  expect(() => assertOutsideSource(join(other, ".codex"), root)).not.toThrow();
});

test("parseOutputDirArgs: 位置引数1個を outputDir に、flags は空で返す", () => {
  expect(parseOutputDirArgs(["/out"])).toEqual({
    outputDir: "/out",
    flags: new Set(),
  });
});

test.each([
  ["位置引数の後", ["/out", "--force"]],
  ["位置引数の前", ["--force", "/out"]],
])(
  "parseOutputDirArgs: allowedFlags の --force を%sでも受理する",
  (_label, args) => {
    const result = parseOutputDirArgs(args, ["--force"]);

    expect(result.outputDir).toBe("/out");
    expect(result.flags).toEqual(new Set(["--force"]));
  },
);

test("parseOutputDirArgs: allowedFlags に含まれない --force は未知のオプション", () => {
  expect(() => parseOutputDirArgs(["/out", "--force"])).toThrow(
    /未知のオプション.*--force/,
  );
});

test.each(["--foo", "-x"])(
  "parseOutputDirArgs: 未知のオプション %s は Error にする",
  (option) => {
    expect(() => parseOutputDirArgs(["/out", option], ["--force"])).toThrow(
      /未知のオプション/,
    );
  },
);

test("parseOutputDirArgs: 位置引数が0個なら Error にする", () => {
  expect(() => parseOutputDirArgs([], ["--force"])).toThrow(
    /出力先ディレクトリを指定/,
  );
});

test("parseOutputDirArgs: フラグのみで位置引数が0個でも Error にする", () => {
  expect(() => parseOutputDirArgs(["--force"], ["--force"])).toThrow(
    /出力先ディレクトリを指定/,
  );
});

test("parseOutputDirArgs: 位置引数が2個以上なら Error にする", () => {
  expect(() => parseOutputDirArgs(["/a", "/b"])).toThrow(/1つだけ/);
});
