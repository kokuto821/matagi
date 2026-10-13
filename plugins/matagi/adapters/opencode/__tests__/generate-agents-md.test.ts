// Run: vitest run (plugins/matagi/ 配下)

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import {
  GENERATED_MARKER,
  generateAgentsMd,
  toAgentMarkdown,
} from "../generate-agents-md.ts";

const agentSource = (name: string, description = `${name}: 説明`) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n本文 ${name}\n`;

/** agents/ に md を置いた擬似プラグインルートを作る。 */
const makeSource = (files: Record<string, string>) => {
  const root = makeTempDir("opencode-agents-src-");
  mkdirSync(join(root, "agents"));
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(root, "agents", file), content);
  }
  return root;
};

const generate = (
  out: string,
  root: string,
  options: { force?: boolean } = {},
) => generateAgentsMd(out, join(root, "agents"), root, options);

describe("toAgentMarkdown", () => {
  test("description を YAML 安全に引用し mode: subagent を付け、name は出力しない", () => {
    const markdown = toAgentMarkdown({
      name: "a",
      description: 'コロン: と "引用符"',
      instructions: "本文\n",
    });

    expect(markdown).toBe(
      `---\n${GENERATED_MARKER}\ndescription: "コロン: と \\"引用符\\""\nmode: subagent\n---\n\n本文\n`,
    );
  });
});

describe("generateAgentsMd", () => {
  test("frontmatter 付き md を変換し、README 等は読み飛ばす", () => {
    const root = makeSource({ "a.md": agentSource("a"), "README.md": "# r\n" });
    const out = makeTempDir();

    const result = generate(out, root);

    expect(result.count).toBe(1);
    expect(readdirSync(join(out, "agents"))).toEqual(["a.md"]);
    expect(readFileSync(join(out, "agents", "a.md"), "utf-8")).toContain(
      "mode: subagent",
    );
  });

  test("同内容の再実行は冪等", () => {
    const root = makeSource({ "a.md": agentSource("a") });
    const out = makeTempDir();
    generate(out, root);

    expect(() => generate(out, root)).not.toThrow();
  });

  test("内容が異なる既存は --force 無しで失敗し、何も書かない", () => {
    const root = makeSource({
      "a.md": agentSource("a"),
      "b.md": agentSource("b"),
    });
    const out = makeTempDir();
    mkdirSync(join(out, "agents"));
    writeFileSync(join(out, "agents", "a.md"), "user own\n");

    expect(() => generate(out, root)).toThrow(/--force/);
    expect(readdirSync(join(out, "agents"))).toEqual(["a.md"]);
    expect(readFileSync(join(out, "agents", "a.md"), "utf-8")).toBe(
      "user own\n",
    );
  });

  test("--force で上書きする", () => {
    const root = makeSource({ "a.md": agentSource("a") });
    const out = makeTempDir();
    mkdirSync(join(out, "agents"));
    writeFileSync(join(out, "agents", "a.md"), "user own\n");

    generate(out, root, { force: true });

    expect(readFileSync(join(out, "agents", "a.md"), "utf-8")).toContain(
      GENERATED_MARKER,
    );
  });

  test("ソースから消えた生成物のみ削除し、ユーザー自作は残す", () => {
    const root = makeSource({
      "a.md": agentSource("a"),
      "gone.md": agentSource("gone"),
    });
    const out = makeTempDir();
    generate(out, root);
    writeFileSync(join(out, "agents", "mine.md"), "---\ndescription: x\n---\n");
    writeFileSync(join(root, "agents", "gone.md"), "# README 化\n");

    const result = generate(out, root);

    expect(result.removed).toEqual(["gone"]);
    expect(readdirSync(join(out, "agents")).sort()).toEqual([
      "a.md",
      "mine.md",
    ]);
  });

  test("ソース md が 0 件なら削除をスキップする", () => {
    const root = makeSource({ "a.md": agentSource("a") });
    const out = makeTempDir();
    generate(out, root);
    rmSync(join(root, "agents", "a.md"));

    const result = generate(out, root);

    expect(result.staleCleanupSkipped).toBe(true);
    expect(readdirSync(join(out, "agents"))).toEqual(["a.md"]);
  });

  test("出力先がソース配下なら中止する", () => {
    const root = makeSource({ "a.md": agentSource("a") });

    expect(() => generate(join(root, "out"), root)).toThrow(/ソース破壊防止/);
  });

  test("agents が通常ファイルでも symlink でもない既存は --force でも拒否する", () => {
    const root = makeSource({ "a.md": agentSource("a") });
    const out = makeTempDir();
    mkdirSync(join(out, "agents", "a.md"), { recursive: true });

    expect(() => generate(out, root, { force: true })).toThrow(
      /置換できません/,
    );
  });

  test("既存 symlink はリンク先を変えず、エントリ自体を置換する", () => {
    const root = makeSource({ "a.md": agentSource("a") });
    const out = makeTempDir();
    const target = join(makeTempDir(), "target.md");
    writeFileSync(target, "original\n");
    mkdirSync(join(out, "agents"));
    symlinkSync(target, join(out, "agents", "a.md"));

    generate(out, root, { force: true });

    expect(readFileSync(target, "utf-8")).toBe("original\n");
    expect(lstatSync(join(out, "agents", "a.md")).isSymbolicLink()).toBe(false);
  });
});
