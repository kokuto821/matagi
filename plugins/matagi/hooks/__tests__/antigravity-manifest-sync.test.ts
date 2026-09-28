// Run: vitest run (plugins/matagi/ 配下)
//
// antigravity-manifest-sync.ts に対するテスト。
//
// この hook は PostToolUse で発火し、plugins/matagi/.claude-plugin/plugin.json への
// 変更を検知したときだけ、作業リポジトリ直下の .agents/plugins/matagi/ に対して
// Antigravity 用アダプタ（generate-plugin-json.ts / generate-hooks-json.ts）を
// 再生成する。ブロック判定は行わない（常に正常終了する）ため、protected-branch-guard.ts
// のような deny 出力の検証は不要で、代わりに「子プロセスを起動したか」を直接検証する。
//
// 子プロセス起動・ファイルシステム存在確認は本体実装からの依存性注入（deps）でモック化する。
// spawnSync をサブプロセス越しにモックする手段がないため（別プロセスの関数は差し替えられない）、
// 本体側は `syncAntigravityManifest(payload, deps)` の形で existsSync / spawnSync を
// 引数として受け取る設計を前提にテストを書く。

import { test, expect } from "vitest";
import { spawnSync as nodeSpawnSync } from "node:child_process";
import { join } from "node:path";
import {
  syncAntigravityManifest,
  TARGET_RELATIVE_PATH,
  ANTIGRAVITY_DIR_RELATIVE_PATH,
} from "../antigravity-manifest-sync.ts";

const SCRIPT_PATH = join(import.meta.dirname ?? __dirname, "..", "antigravity-manifest-sync.ts");

type SpawnSyncCall = { command: string; args: string[] };

const createSpawnSyncMock = () => {
  const calls: SpawnSyncCall[] = [];
  const spawnSync = (command: string, args: string[] = []) => {
    calls.push({ command, args });
    return { status: 0, stdout: "", stderr: "" };
  };
  return { spawnSync, calls };
};

const createExistsSyncMock = (existingPaths: Set<string>) => {
  const calls: string[] = [];
  const existsSync = (path: string) => {
    calls.push(path);
    return existingPaths.has(path);
  };
  return { existsSync, calls };
};

test("対象外ファイル（plugin.json以外）への変更では子プロセスを起動しない", () => {
  // Arrange
  const cwd = "/repo";
  const { spawnSync, calls: spawnCalls } = createSpawnSyncMock();
  const antigravityDir = join(cwd, ANTIGRAVITY_DIR_RELATIVE_PATH);
  const { existsSync } = createExistsSyncMock(new Set([antigravityDir]));
  const payload = {
    tool_name: "Edit",
    tool_input: { file_path: join(cwd, "README.md") },
    cwd,
  };

  // Act
  syncAntigravityManifest(payload, { existsSync, spawnSync });

  // Assert
  expect(spawnCalls.length).toBe(0);
});

test("対象ファイル（plugin.json）への変更だが.agents/plugins/matagi/が存在しない場合は子プロセスを起動しない", () => {
  // Arrange
  const cwd = "/repo";
  const { spawnSync, calls: spawnCalls } = createSpawnSyncMock();
  const { existsSync } = createExistsSyncMock(new Set()); // .agents/plugins/matagi/ 不在
  const payload = {
    tool_name: "Edit",
    tool_input: { file_path: join(cwd, TARGET_RELATIVE_PATH) },
    cwd,
  };

  // Act
  syncAntigravityManifest(payload, { existsSync, spawnSync });

  // Assert
  expect(spawnCalls.length).toBe(0);
});

test("対象ファイル（plugin.json）への変更かつ.agents/plugins/matagi/が存在する場合はgenerate-plugin-json.tsとgenerate-hooks-json.tsの2つを子プロセスとして起動する", () => {
  // Arrange
  const cwd = "/repo";
  const { spawnSync, calls: spawnCalls } = createSpawnSyncMock();
  const antigravityDir = join(cwd, ANTIGRAVITY_DIR_RELATIVE_PATH);
  const { existsSync } = createExistsSyncMock(new Set([antigravityDir]));
  const payload = {
    tool_name: "Edit",
    tool_input: { file_path: join(cwd, TARGET_RELATIVE_PATH) },
    cwd,
  };

  // Act
  syncAntigravityManifest(payload, { existsSync, spawnSync });

  // Assert
  expect(spawnCalls.length).toBe(2);

  const joinedCommands = spawnCalls.map((call) => [call.command, ...call.args].join(" "));
  expect(
    joinedCommands.some(
      (cmd) =>
        cmd.includes("--experimental-strip-types") &&
        cmd.includes("plugins/matagi/adapters/antigravity/generate-plugin-json.ts") &&
        cmd.includes(ANTIGRAVITY_DIR_RELATIVE_PATH),
    ),
    `generate-plugin-json.ts起動コマンドが見つからない: ${JSON.stringify(joinedCommands)}`,
  ).toBeTruthy();
  expect(
    joinedCommands.some(
      (cmd) =>
        cmd.includes("--experimental-strip-types") &&
        cmd.includes("plugins/matagi/adapters/antigravity/generate-hooks-json.ts") &&
        cmd.includes(ANTIGRAVITY_DIR_RELATIVE_PATH),
    ),
    `generate-hooks-json.ts起動コマンドが見つからない: ${JSON.stringify(joinedCommands)}`,
  ).toBeTruthy();
});

test("tool_input に file_path が無い場合（不正なペイロード）は子プロセスを起動しない", () => {
  // Arrange
  const cwd = "/repo";
  const { spawnSync, calls: spawnCalls } = createSpawnSyncMock();
  const antigravityDir = join(cwd, ANTIGRAVITY_DIR_RELATIVE_PATH);
  const { existsSync } = createExistsSyncMock(new Set([antigravityDir]));
  const payload = {
    tool_name: "Edit",
    tool_input: {},
    cwd,
  };

  // Act
  syncAntigravityManifest(payload, { existsSync, spawnSync });

  // Assert
  expect(spawnCalls.length).toBe(0);
});

test("cwd が payload に無い場合は process.cwd() 相当にフォールバックする", () => {
  // Arrange
  const cwd = process.cwd();
  const { spawnSync, calls: spawnCalls } = createSpawnSyncMock();
  const antigravityDir = join(cwd, ANTIGRAVITY_DIR_RELATIVE_PATH);
  const { existsSync } = createExistsSyncMock(new Set([antigravityDir]));
  const payload = {
    tool_name: "Edit",
    tool_input: { file_path: join(cwd, TARGET_RELATIVE_PATH) },
  };

  // Act
  syncAntigravityManifest(payload, { existsSync, spawnSync });

  // Assert
  expect(spawnCalls.length).toBe(2);
});

test("CLI起動時に不正なJSON入力を渡すとexit code 0で子プロセスを起動しない", () => {
  // Arrange (入力自体が不正なJSON文字列)

  // Act
  const result = nodeSpawnSync("node", [SCRIPT_PATH], {
    input: "{ this is not json",
    encoding: "utf-8",
  });

  // Assert
  expect(result.status).toBe(0);
  expect((result.stderr || "").trim()).toBe("");
});
