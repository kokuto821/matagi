// hooks テスト共通ヘルパー。
// protected-branch-guard.test.ts / pr-merge-guard.test.ts から共有される
// runHook / Payload 型 / 拒否出力パース / 一時 git リポジトリ管理をまとめる。

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Payload = {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  cwd?: string;
};

/**
 * 対象フックスクリプトを起動し、payload を stdin として渡す。
 *
 * デフォルトでは CLAUDE_PROTECTED_BRANCHES を明示的に unset した環境で実行する
 * （開発者のシェルに設定が残っているとテストの独立性が壊れるため）。
 * 上書きが必要なテストは envOverrides で個別に指定する。
 */
export const runHook = (
  scriptPath: string,
  payload: Payload,
  envOverrides: Record<string, string | undefined> = {},
) => {
  const env: Record<string, string | undefined> = {
    ...process.env,
    CLAUDE_PROTECTED_BRANCHES: undefined,
  };
  for (const [key, value] of Object.entries(envOverrides)) {
    env[key] = value;
  }

  return spawnSync("node", [scriptPath], {
    input: JSON.stringify(payload),
    encoding: "utf-8",
    env,
  });
};

export const parseDenyOutput = (stdout: string) => {
  const parsed = JSON.parse(stdout);
  return parsed.hookSpecificOutput;
};

const initGitRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "hook-test-repo-"));
  spawnSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: dir });
  writeFileSync(join(dir, "README.md"), "init\n");
  spawnSync("git", ["add", "."], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "init"], { cwd: dir });
  return dir;
};

/** 一時 git リポジトリを作成し、fn に渡す。fn の完了後（例外時も含め）に必ず削除する。 */
export const withTempRepo = <T>(fn: (repoDir: string) => T): T => {
  const repo = initGitRepo();
  try {
    return fn(repo);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
};

export const checkoutNewBranch = (dir: string, branch: string) => {
  spawnSync("git", ["switch", "-c", branch], { cwd: dir });
};

/** apply_patch のパッチ本文を組み立てる。headers には `*** Update File: x` 等の行を渡す。 */
export const buildApplyPatch = (...headers: string[]): string => {
  return ["*** Begin Patch", ...headers, "*** End Patch"].join("\n");
};

/** 一時ディレクトリ（git 未初期化）を作成し、fn に渡す。fn の完了後（例外時も含め）に必ず削除する。 */
export const withTempDir = <T>(prefix: string, fn: (dir: string) => T): T => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
