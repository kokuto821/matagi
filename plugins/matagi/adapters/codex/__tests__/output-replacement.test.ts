// Run: vitest run (plugins/matagi/ 配下)
// generate-agents-toml / generate-hooks-config 共通の「出力パス置換」安全性の検証。
// ディレクトリ拒否・symlink / ハードリンクの置換（リンク先不変）・一時ファイル(.tmp)の非残存を、両生成器で確認する。

import {
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import { generateAgentsToml } from "../generate-agents-toml.ts";
import {
  type ClaudePluginManifest,
  generateHooksConfig,
} from "../generate-hooks-config.ts";

const manifest: ClaudePluginManifest = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Edit|Write",
        hooks: [
          {
            type: "command",
            command: `node --experimental-strip-types "\${CLAUDE_PLUGIN_ROOT}/hooks/protected-branch-guard.ts"`,
          },
        ],
      },
    ],
  },
};

/** 生成器ごとの差異（出力先の用意・実行・出力パス）を吸収するハーネス。 */
type Harness = {
  label: string;
  /** 出力ディレクトリ・出力ファイルの親ディレクトリ・出力ファイルパス・実行関数を返す */
  setup: () => {
    outputParent: string;
    outputPath: string;
    sourceRoot: string;
    run: (force: boolean) => void;
  };
};

const agentsHarness: Harness = {
  label: "generate-agents-toml",
  setup: () => {
    const sourceRoot = makeTempDir("replace-agents-src-");
    const agentsDir = join(sourceRoot, "agents");
    mkdirSync(agentsDir);
    writeFileSync(
      join(agentsDir, "a.md"),
      "---\nname: agent-a\ndescription: A\n---\n指示A\n",
    );
    const out = makeTempDir("replace-agents-out-");
    const outputParent = join(out, "agents");
    mkdirSync(outputParent);
    return {
      outputParent,
      outputPath: join(outputParent, "agent-a.toml"),
      sourceRoot,
      run: (force) => {
        generateAgentsToml(out, agentsDir, sourceRoot, { force });
      },
    };
  },
};

const hooksHarness: Harness = {
  label: "generate-hooks-config",
  setup: () => {
    const sourceRoot = makeTempDir("replace-hooks-src-");
    const out = makeTempDir("replace-hooks-out-");
    return {
      outputParent: out,
      outputPath: join(out, "config.toml"),
      sourceRoot,
      run: (force) => {
        generateHooksConfig(out, { force }, manifest, sourceRoot);
      },
    };
  },
};

const hasTmp = (dir: string) =>
  readdirSync(dir).filter((name) => name.endsWith(".tmp"));

describe.each([agentsHarness, hooksHarness])("$label", ({ setup }) => {
  test("出力先がディレクトリなら --force でも Error にし何も書かず .tmp も残さない", () => {
    const { outputParent, outputPath, run } = setup();
    mkdirSync(outputPath);
    writeFileSync(join(outputPath, "keep.txt"), "keep\n");

    expect(() => run(true)).toThrow(/置換できません/);

    expect(lstatSync(outputPath).isDirectory()).toBe(true);
    expect(readdirSync(outputPath)).toEqual(["keep.txt"]);
    expect(hasTmp(outputParent)).toEqual([]);
  });

  test("既存が symlink なら --force 後もリンク先は不変で出力パスは通常ファイルに置換される", () => {
    const { outputPath, run } = setup();
    const target = join(makeTempDir("replace-link-target-"), "target.toml");
    writeFileSync(target, "target original\n");
    symlinkSync(target, outputPath);

    run(true);

    expect(readFileSync(target, "utf-8")).toBe("target original\n");
    const stat = lstatSync(outputPath);
    expect(stat.isSymbolicLink()).toBe(false);
    expect(stat.isFile()).toBe(true);
    expect(readFileSync(outputPath, "utf-8")).not.toBe("target original\n");
  });

  test("既存がソース側ファイルとのハードリンクなら --force 後もそのファイルの内容と inode は不変で出力パスは別 inode になる", () => {
    const { outputPath, sourceRoot, run } = setup();
    const sourceFile = join(sourceRoot, "precious.txt");
    writeFileSync(sourceFile, "precious original\n");
    linkSync(sourceFile, outputPath);
    const inodeBefore = statSync(sourceFile).ino;

    run(true);

    expect(readFileSync(sourceFile, "utf-8")).toBe("precious original\n");
    expect(statSync(sourceFile).ino).toBe(inodeBefore);
    expect(statSync(outputPath).ino).not.toBe(inodeBefore);
    expect(readFileSync(outputPath, "utf-8")).not.toBe("precious original\n");
  });

  test("正常に書き込んだ後は出力ディレクトリに .tmp が残らない", () => {
    const { outputParent, run } = setup();

    run(false);

    expect(hasTmp(outputParent)).toEqual([]);
  });

  test("symlink を置換した後も .tmp が残らず symlink 先を指すリンクは消える", () => {
    const { outputParent, outputPath, run } = setup();
    const target = join(makeTempDir("replace-link-target-"), "t.toml");
    writeFileSync(target, "t\n");
    symlinkSync(target, outputPath);
    expect(readlinkSync(outputPath)).toBe(target);

    run(true);

    expect(hasTmp(outputParent)).toEqual([]);
    expect(() => readlinkSync(outputPath)).toThrow();
  });
});
