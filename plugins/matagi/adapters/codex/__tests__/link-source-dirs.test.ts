// Run: vitest run (plugins/matagi/ 配下)

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import * as shared from "../../shared.ts";
import {
  assertOutsideSource,
  linkSourceDirs,
  listSkillNames,
  realpathNonStrict,
  relink,
  removeStaleSkillLinks,
} from "../link-source-dirs.ts";

/** skills/<name>/SKILL.md と hooks/ を持つ擬似プラグインルートを作る。 */
const makePluginRoot = (skillNames: string[] = ["skill-a", "skill-b"]) => {
  const root = makeTempDir();
  mkdirSync(join(root, "hooks"));
  writeFileSync(join(root, "hooks", "guard.ts"), "// guard\n");
  mkdirSync(join(root, "skills"));
  writeFileSync(join(root, "skills", "README.md"), "# skills\n");
  for (const name of skillNames) {
    mkdirSync(join(root, "skills", name));
    writeFileSync(join(root, "skills", name, "SKILL.md"), `# ${name}\n`);
  }
  return root;
};

const isSymlink = (path: string) =>
  lstatSync(path, { throwIfNoEntry: false })?.isSymbolicLink() === true;

test("link-source-dirs: assertOutsideSource / realpathNonStrict は shared.ts と同一の関数を再エクスポートする", () => {
  expect(assertOutsideSource).toBe(shared.assertOutsideSource);
  expect(realpathNonStrict).toBe(shared.realpathNonStrict);
});

test("assertOutsideSource: 出力先がソースと同一なら Error にする", () => {
  const root = makePluginRoot();

  expect(() => assertOutsideSource(root, root)).toThrow(/ソース破壊防止/);
});

test.each([
  ["既存の配下", ["skills"]],
  ["未作成の配下", ["not", "yet", "created"]],
])(
  "assertOutsideSource: 出力先がソースの%sなら Error にする",
  (_label, segments) => {
    const root = makePluginRoot();

    expect(() => assertOutsideSource(join(root, ...segments), root)).toThrow();
  },
);

test.each([
  ["名前が前方一致するだけの兄弟", "plugin-sibling"],
  ["隣接する .codex", ".codex"],
])(
  "assertOutsideSource: ソース外（%s）なら例外を投げない",
  (_label, outsideName) => {
    const parent = makeTempDir();
    const root = join(parent, "plugin");
    mkdirSync(root);
    mkdirSync(join(parent, outsideName), { recursive: true });

    expect(() =>
      assertOutsideSource(join(parent, outsideName), root),
    ).not.toThrow();
  },
);

test("assertOutsideSource: ソース配下を指す symlink 経由の出力先は Error にする", () => {
  const root = makePluginRoot();
  const parent = makeTempDir();
  symlinkSync(join(root, "skills"), join(parent, "link"), "dir");

  expect(() => assertOutsideSource(join(parent, "link"), root)).toThrow();
});

test("relink: symlink が無ければ新規に張る", () => {
  const dir = makeTempDir();
  const target = join(dir, "target");
  mkdirSync(target);

  relink(join(dir, "link"), target);

  expect(readlinkSync(join(dir, "link"))).toBe(target);
});

test("relink: 既存 symlink を張り直し、繰り返しても冪等", () => {
  const dir = makeTempDir();
  const oldTarget = join(dir, "old");
  const newTarget = join(dir, "new");
  mkdirSync(oldTarget);
  mkdirSync(newTarget);
  symlinkSync(oldTarget, join(dir, "link"), "dir");

  relink(join(dir, "link"), newTarget);
  relink(join(dir, "link"), newTarget);

  expect(readlinkSync(join(dir, "link"))).toBe(newTarget);
});

test("relink: 壊れた symlink も張り直せる", () => {
  const dir = makeTempDir();
  const target = join(dir, "target");
  mkdirSync(target);
  symlinkSync(join(dir, "missing"), join(dir, "link"), "dir");

  relink(join(dir, "link"), target);

  expect(readlinkSync(join(dir, "link"))).toBe(target);
});

test("relink: 実ディレクトリは削除せず Error にする", () => {
  const dir = makeTempDir();
  mkdirSync(join(dir, "link"));
  writeFileSync(join(dir, "link", "keep.txt"), "keep");

  expect(() => relink(join(dir, "link"), dir)).toThrow(/symlink ではない/);

  expect(existsSync(join(dir, "link", "keep.txt"))).toBe(true);
});

test("relink: 実ファイルは削除せず Error にする", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "link"), "keep");

  expect(() => relink(join(dir, "link"), dir)).toThrow(/symlink ではない/);

  expect(lstatSync(join(dir, "link")).isFile()).toBe(true);
});

test("listSkillNames: ディレクトリのみを返し、ファイルは除く", () => {
  const root = makePluginRoot(["skill-a", "skill-b"]);

  expect(listSkillNames(join(root, "skills")).sort()).toEqual([
    "skill-a",
    "skill-b",
  ]);
});

test("removeStaleSkillLinks: ソース skills を指す古い symlink のみ削除して名前を返す", () => {
  const root = makePluginRoot(["current"]);
  const skillsSource = join(root, "skills");
  const out = makeTempDir();
  const elsewhere = makeTempDir();
  // 古い（ソースから削除済み）: 対象は既に存在しない
  symlinkSync(join(skillsSource, "removed"), join(out, "removed"), "dir");
  // 現行スキル
  symlinkSync(join(skillsSource, "current"), join(out, "current"), "dir");
  // ソース外を指す利用者自前の symlink
  symlinkSync(elsewhere, join(out, "user-own"), "dir");
  // 実ディレクトリ
  mkdirSync(join(out, "real-dir"));

  const removed = removeStaleSkillLinks(out, skillsSource, ["current"]);

  expect(removed).toEqual(["removed"]);
  expect(isSymlink(join(out, "removed"))).toBe(false);
  expect(isSymlink(join(out, "current"))).toBe(true);
  expect(isSymlink(join(out, "user-own"))).toBe(true);
  expect(existsSync(join(out, "real-dir"))).toBe(true);
});

test("linkSourceDirs: hooks と全スキルを symlink し、スキル数を返す", () => {
  const root = makePluginRoot(["skill-a", "skill-b"]);
  const out = join(makeTempDir(), ".codex");

  const count = linkSourceDirs(out, root);

  expect(count).toBe(2);
  expect(readlinkSync(join(out, "hooks"))).toBe(join(root, "hooks"));
  expect(readlinkSync(join(out, "skills", "skill-a"))).toBe(
    join(root, "skills", "skill-a"),
  );
  expect(readdirSync(join(out, "skills")).sort()).toEqual([
    "skill-a",
    "skill-b",
  ]);
});

test("linkSourceDirs: 再実行しても冪等で、ソースから消えたスキルの symlink は除去される", () => {
  const root = makePluginRoot(["skill-a", "skill-b"]);
  const out = join(makeTempDir(), ".codex");
  linkSourceDirs(out, root);
  rmSync(join(root, "skills", "skill-b"), { recursive: true });

  const count = linkSourceDirs(out, root);

  expect(count).toBe(1);
  expect(readdirSync(join(out, "skills"))).toEqual(["skill-a"]);
});

test.each([
  ["ソース配下の .codex", (root: string) => join(root, ".codex")],
  ["ソースと同一", (root: string) => root],
])(
  "linkSourceDirs: 出力先が%sなら Error にしソースを消さない",
  (_label, outputOf) => {
    const root = makePluginRoot();

    expect(() => linkSourceDirs(outputOf(root), root)).toThrow(
      /ソース破壊防止/,
    );

    expect(existsSync(join(root, "hooks", "guard.ts"))).toBe(true);
    expect(existsSync(join(root, "skills", "skill-a", "SKILL.md"))).toBe(true);
  },
);

test("linkSourceDirs: 出力先 skills がソース skills への symlink なら Error にしソースを変更しない", () => {
  const root = makePluginRoot();
  const out = join(makeTempDir(), ".codex");
  mkdirSync(out);
  symlinkSync(join(root, "skills"), join(out, "skills"), "dir");

  expect(() => linkSourceDirs(out, root)).toThrow(/ソース破壊防止/);

  expect(readdirSync(join(root, "skills")).sort()).toEqual([
    "README.md",
    "skill-a",
    "skill-b",
  ]);
  expect(isSymlink(join(root, "skills", "skill-a"))).toBe(false);
});

test("linkSourceDirs: 出力先に実ディレクトリの hooks があれば Error にし中身を残す", () => {
  const root = makePluginRoot();
  const out = join(makeTempDir(), ".codex");
  mkdirSync(join(out, "hooks"), { recursive: true });
  writeFileSync(join(out, "hooks", "mine.ts"), "// mine\n");

  expect(() => linkSourceDirs(out, root)).toThrow(/symlink ではない/);

  expect(existsSync(join(out, "hooks", "mine.ts"))).toBe(true);
});
