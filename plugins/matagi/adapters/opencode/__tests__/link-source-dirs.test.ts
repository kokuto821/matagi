// Run: vitest run (plugins/matagi/ 配下)

import {
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import { linkSourceDirs } from "../link-source-dirs.ts";

const makePluginRoot = (skillNames: string[]) => {
  const root = makeTempDir("opencode-link-src-");
  mkdirSync(join(root, "skills"));
  writeFileSync(join(root, "skills", "README.md"), "# skills\n");
  for (const name of skillNames) {
    mkdirSync(join(root, "skills", name));
    writeFileSync(join(root, "skills", name, "SKILL.md"), `# ${name}\n`);
  }
  return root;
};

const entry = (dir: string) => {
  const path = join(dir, "matagi-hooks.ts");
  writeFileSync(path, "// plugin\n");
  return path;
};

test("skills の各ディレクトリと hooks プラグインを symlink する", () => {
  const root = makePluginRoot(["skill-a", "skill-b"]);
  const out = makeTempDir();
  const pluginEntry = entry(makeTempDir());

  const count = linkSourceDirs(out, root, pluginEntry);

  expect(count).toBe(2);
  expect(readlinkSync(join(out, "skills", "skill-a"))).toBe(
    join(root, "skills", "skill-a"),
  );
  expect(readlinkSync(join(out, "plugins", "matagi-hooks.ts"))).toBe(
    pluginEntry,
  );
});

test("ソースから消えたスキルの symlink を除去する", () => {
  const root = makePluginRoot(["skill-a", "skill-b"]);
  const out = makeTempDir();
  const pluginEntry = entry(makeTempDir());
  linkSourceDirs(out, root, pluginEntry);
  rmSync(join(root, "skills", "skill-b"), { recursive: true });

  linkSourceDirs(out, root, pluginEntry);

  expect(
    lstatSync(join(out, "skills", "skill-b"), { throwIfNoEntry: false }),
  ).toBeUndefined();
  expect(lstatSync(join(out, "skills", "skill-a")).isSymbolicLink()).toBe(true);
});

test("出力先がソース配下なら中止する", () => {
  const root = makePluginRoot(["skill-a"]);

  expect(() =>
    linkSourceDirs(join(root, "out"), root, entry(makeTempDir())),
  ).toThrow(/ソース破壊防止/);
});

test("symlink 以外の既存物は削除せずエラーにする", () => {
  const root = makePluginRoot(["skill-a"]);
  const out = makeTempDir();
  mkdirSync(join(out, "plugins"));
  writeFileSync(join(out, "plugins", "matagi-hooks.ts"), "mine\n");

  expect(() => linkSourceDirs(out, root, entry(makeTempDir()))).toThrow(
    /上書きしません/,
  );
});
