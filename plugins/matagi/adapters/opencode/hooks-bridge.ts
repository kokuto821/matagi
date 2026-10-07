// biome-ignore-all lint/style/useNamingConvention: Claude Code フック入力（tool_name 等）の snake_case キーに合わせるため
/**
 * OpenCode プラグイン（matagi-hooks.ts）から、既存の hooks/*.ts（Claude Code 向け PreToolUse フック）を
 * 再利用するためのブリッジ。
 *
 * フックのロジックは複製せず、OpenCode のツール呼び出しを Claude Code 形式の入力
 * （`{ tool_name, tool_input, cwd }`）に写して既存スクリプトへ stdin で渡し、stdout の deny を拒否理由として返す。
 *
 * ツール名の対応（OpenCode → フックが期待する名前）:
 * - bash → Bash（`args.command`）
 * - edit / multiedit / write → Edit / Edit / Write（`args.filePath` → `file_path`）
 * - apply_patch → apply_patch（`args.patchText` → `command`。パッチ書式は Codex と同一）
 * 上記以外のツールは対象外（null）。
 *
 * 判定できないケース（フックの起動失敗・タイムアウト・出力が deny でない等）は許可する（fail-open）。
 * 保護が黙って外れないよう、原因は stderr に 1 行残す（既存フックと同じ方針）。
 */

import { spawnSync } from "node:child_process";
import { basename, join } from "node:path";
import { reportFailOpen } from "../../hooks/fail-open.ts";

const HOOKS_DIR = join(import.meta.dirname, "../../hooks");
const GUARD_SCRIPTS = ["protected-branch-guard.ts", "pr-merge-guard.ts"];
const GUARD_TIMEOUT_MS = 5000;

export type GuardPayload = {
  tool_name: string;
  tool_input: Record<string, unknown>;
  cwd: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/** OpenCode のツール呼び出しをフック入力へ写す。対象外のツール・引数なら null。 */
export const toGuardPayload = (
  tool: string,
  args: unknown,
  cwd: string,
): GuardPayload | null => {
  if (!isRecord(args)) {
    return null;
  }
  switch (tool) {
    case "bash":
      return {
        tool_name: "Bash",
        tool_input: { command: args.command },
        // bash ツールは workdir で別ディレクトリ実行できるため、指定があればそちらを判定対象にする
        cwd:
          typeof args.workdir === "string" && args.workdir ? args.workdir : cwd,
      };
    case "edit":
    case "multiedit":
    case "write":
      return {
        tool_name: tool === "write" ? "Write" : "Edit",
        tool_input: { file_path: args.filePath },
        cwd,
      };
    case "apply_patch":
      return {
        tool_name: "apply_patch",
        tool_input: { command: args.patchText },
        cwd,
      };
    default:
      return null;
  }
};

/** フックの stdout（deny JSON）から拒否理由を取り出す。deny でなければ null。 */
export const parseDenyReason = (stdout: string): string | null => {
  if (!stdout.trim()) {
    return null;
  }
  const output: unknown = JSON.parse(stdout);
  const specific = isRecord(output) ? output.hookSpecificOutput : null;
  if (!isRecord(specific) || specific.permissionDecision !== "deny") {
    return null;
  }
  return typeof specific.permissionDecisionReason === "string"
    ? specific.permissionDecisionReason
    : "フックによりブロックされました。";
};

/** 1 本のフックを実行して拒否理由を返す。許可なら null。起動失敗等は fail-open（stderr に記録して null）。 */
const runGuard = (
  scriptPath: string,
  payload: GuardPayload,
  write?: (message: string) => unknown,
): string | null => {
  try {
    const result = spawnSync(
      "node",
      ["--experimental-strip-types", scriptPath],
      {
        input: JSON.stringify(payload),
        encoding: "utf-8",
        timeout: GUARD_TIMEOUT_MS,
      },
    );
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`フックが終了コード ${result.status} で終了しました`);
    }
    return parseDenyReason(result.stdout);
  } catch (error) {
    // reportFailOpen の固定プレフィックスは protected-branch-guard 用のため、どのスクリプトの失敗かを補う
    reportFailOpen(
      new Error(
        `${basename(scriptPath)}: ${error instanceof Error ? error.message : String(error)}`,
      ),
      write,
    );
    return null;
  }
};

/** ツール呼び出しに対し、いずれかのフックが拒否するなら最初の拒否理由を返す。許可なら null。 */
export const findDenyReason = (
  tool: string,
  args: unknown,
  cwd: string,
  hooksDir: string = HOOKS_DIR,
  write?: (message: string) => unknown,
): string | null => {
  const payload = toGuardPayload(tool, args, cwd);
  if (payload === null) {
    return null;
  }
  for (const script of GUARD_SCRIPTS) {
    const reason = runGuard(join(hooksDir, script), payload, write);
    if (reason) {
      return reason;
    }
  }
  return null;
};
