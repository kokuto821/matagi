// Run: vitest run (plugins/matagi/ 配下)

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import {
  findDenyReason,
  parseDenyReason,
  toGuardPayload,
} from "../hooks-bridge.ts";

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", ["-C", cwd, ...args], { encoding: "utf-8" });

/** 指定ブランチ上に追跡ファイル a.txt を持つ一時リポジトリを作る。 */
const makeRepo = (branch: string) => {
  const repo = makeTempDir("opencode-bridge-");
  git(repo, "init", "-q", "-b", branch);
  git(repo, "config", "user.email", "t@example.com");
  git(repo, "config", "user.name", "t");
  writeFileSync(join(repo, "a.txt"), "a\n");
  git(repo, "add", ".");
  git(repo, "commit", "-q", "-m", "init");
  return repo;
};

describe("toGuardPayload", () => {
  test.each([
    [
      "bash",
      { command: "ls" },
      { tool_name: "Bash", tool_input: { command: "ls" } },
    ],
    [
      "edit",
      { filePath: "a.txt" },
      { tool_name: "Edit", tool_input: { file_path: "a.txt" } },
    ],
    [
      "write",
      { filePath: "a.txt" },
      { tool_name: "Write", tool_input: { file_path: "a.txt" } },
    ],
    [
      "apply_patch",
      { patchText: "*** Begin Patch" },
      { tool_name: "apply_patch", tool_input: { command: "*** Begin Patch" } },
    ],
  ])("%s をフック入力形式へ写す", (tool, args, expected) => {
    expect(toGuardPayload(tool, args, "/cwd")).toEqual({
      ...expected,
      cwd: "/cwd",
    });
  });

  test("bash の workdir があれば cwd として優先する", () => {
    expect(
      toGuardPayload("bash", { command: "ls", workdir: "/other" }, "/cwd")?.cwd,
    ).toBe("/other");
  });

  test.each([["read"], ["grep"], ["unknown"]])(
    "対象外ツール %s は null",
    (tool) => {
      expect(toGuardPayload(tool, { filePath: "a.txt" }, "/cwd")).toBeNull();
    },
  );

  test.each([[null], ["str"], [[1]]])(
    "args がオブジェクトでなければ null",
    (args) => {
      expect(toGuardPayload("bash", args, "/cwd")).toBeNull();
    },
  );
});

describe("parseDenyReason", () => {
  test("deny JSON から理由を返す", () => {
    const stdout = JSON.stringify({
      hookSpecificOutput: {
        permissionDecision: "deny",
        permissionDecisionReason: "理由",
      },
    });

    expect(parseDenyReason(stdout)).toBe("理由");
  });

  test("空出力は許可（null）", () => {
    expect(parseDenyReason("")).toBeNull();
  });

  test("deny 以外は null", () => {
    expect(
      parseDenyReason(
        JSON.stringify({ hookSpecificOutput: { permissionDecision: "allow" } }),
      ),
    ).toBeNull();
  });

  test("不正な JSON は例外（呼び出し側が fail-open にする）", () => {
    expect(() => parseDenyReason("not json")).toThrow();
  });
});

describe("findDenyReason（実フックを起動）", () => {
  test("保護ブランチ上の git commit を拒否する", () => {
    const repo = makeRepo("main");

    const reason = findDenyReason("bash", { command: "git commit -m x" }, repo);

    expect(reason).toMatch(/保護ブランチ `main`/);
  });

  test("保護ブランチ上の edit を拒否する", () => {
    const repo = makeRepo("main");

    const reason = findDenyReason(
      "edit",
      { filePath: join(repo, "a.txt") },
      repo,
    );

    expect(reason).toMatch(/ファイル変更/);
  });

  test("保護ブランチ上の apply_patch を拒否する", () => {
    const repo = makeRepo("main");
    const patchText =
      "*** Begin Patch\n*** Update File: a.txt\n@@\n-a\n+b\n*** End Patch";

    const reason = findDenyReason("apply_patch", { patchText }, repo);

    expect(reason).toMatch(/ファイル変更/);
  });

  test("保護ブランチ上の write を拒否する", () => {
    const repo = makeRepo("main");

    expect(
      findDenyReason("write", { filePath: join(repo, "a.txt") }, repo),
    ).toMatch(/ファイル変更/);
  });

  test("保護ブランチ上の apply_patch の Move to（移動先）を拒否する", () => {
    const repo = makeRepo("main");
    const patchText =
      "*** Begin Patch\n*** Add File: new.txt\n+x\n*** Move to: a.txt\n*** End Patch";

    expect(findDenyReason("apply_patch", { patchText }, repo)).toMatch(
      /ファイル変更/,
    );
  });

  test("bash の workdir が保護ブランチのリポジトリなら拒否する", () => {
    const protectedRepo = makeRepo("main");
    const otherRepo = makeRepo("feat/#1_x");

    const reason = findDenyReason(
      "bash",
      { command: "git commit -m x", workdir: protectedRepo },
      otherRepo,
    );

    expect(reason).toMatch(/保護ブランチ `main`/);
  });

  test("作業ブランチ上の edit は許可する", () => {
    const repo = makeRepo("feat/#1_x");

    const reason = findDenyReason(
      "edit",
      { filePath: join(repo, "a.txt") },
      repo,
    );

    expect(reason).toBeNull();
  });

  test("gh pr merge を常に拒否する", () => {
    const repo = makeRepo("feat/#1_x");

    const reason = findDenyReason("bash", { command: "gh pr merge 1" }, repo);

    expect(reason).toMatch(/gh pr merge/);
  });

  test("対象外ツールは許可する", () => {
    expect(
      findDenyReason("read", { filePath: "a.txt" }, makeRepo("main")),
    ).toBeNull();
  });

  test("フックが起動できない場合は fail-open し、原因を書き出す", () => {
    const messages: string[] = [];
    const emptyHooksDir = makeTempDir("opencode-bridge-hooks-");

    const reason = findDenyReason(
      "bash",
      { command: "git commit -m x" },
      makeRepo("main"),
      emptyHooksDir,
      (message) => messages.push(message),
    );

    expect(reason).toBeNull();
    expect(messages.join("")).toMatch(/protected-branch-guard\.ts/);
  });
});
