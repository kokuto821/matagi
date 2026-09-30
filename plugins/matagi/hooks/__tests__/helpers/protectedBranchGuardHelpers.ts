// protected-branch-guard.test.ts 用の共通ヘルパー。
// フック起動（apply_patch）・拒否/許可アサーション・一時リポジトリへのファイル準備をまとめる。

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { parseDenyOutput, runHook } from "./hookTestHelpers.ts";

export const GUARD_SCRIPT_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "protected-branch-guard.ts",
);

type HookResult = ReturnType<typeof runHook>;

export const runApplyPatch = (
  repo: string,
  command: unknown,
  cwd: string = repo,
) => {
  return runHook(GUARD_SCRIPT_PATH, {
    tool_name: "apply_patch",
    tool_input: { command },
    cwd,
  });
};

/** deny を返したこと（exit 0 かつ permissionDecision が deny）を検証する。 */
export const expectDeny = (result: HookResult) => {
  expect(result.status).toBe(0);
  expect(parseDenyOutput(result.stdout).permissionDecision).toBe("deny");
};

/** deny を返し、かつ理由が pattern に一致することを検証する。 */
export const expectDenyMatching = (
  result: HookResult,
  reasonPattern: RegExp,
) => {
  expectDeny(result);
  expect(parseDenyOutput(result.stdout).permissionDecisionReason).toMatch(
    reasonPattern,
  );
};

/** 許可（exit 0 かつ stdout が空）を検証する。 */
export const expectAllow = (result: HookResult) => {
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe("");
};

export const commitFile = (
  repo: string,
  relativePath: string,
  content = "x\n",
) => {
  const full = join(repo, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  spawnSync("git", ["add", "."], { cwd: repo });
  spawnSync("git", ["commit", "-q", "-m", `add ${relativePath}`], {
    cwd: repo,
  });
};

/** name を .gitignore に登録してコミットし、name の実ファイルを作る。 */
export const ignoreFile = (repo: string, name: string) => {
  writeFileSync(join(repo, ".gitignore"), `${name}\n`);
  spawnSync("git", ["add", ".gitignore"], { cwd: repo });
  spawnSync("git", ["commit", "-q", "-m", "add gitignore"], { cwd: repo });
  writeFileSync(join(repo, name), "scratch\n");
};
