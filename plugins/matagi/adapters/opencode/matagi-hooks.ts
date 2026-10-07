/**
 * matagi の PreToolUse フック（保護ブランチ上の変更・`gh pr merge` の拒否）を OpenCode で有効にするプラグイン。
 *
 * OpenCode は `<設定ルート>/plugins/*.ts` を起動時に読み込む。`link-source-dirs.ts` がこのファイルを
 * `<設定ルート>/plugins/matagi-hooks.ts` へ symlink する。判定ロジックは既存の hooks/*.ts を再利用する
 * （hooks-bridge.ts）。OpenCode はプラグインファイルの全 export を読み込むため、export はこのプラグイン1つに限る。
 */

import { findDenyReason } from "./hooks-bridge.ts";

type PluginContext = { directory: string };
type ToolExecuteBeforeInput = { tool: string };
type ToolExecuteBeforeOutput = { args: unknown };

export const MatagiHooks = async ({ directory }: PluginContext) => {
  return {
    "tool.execute.before": async (
      input: ToolExecuteBeforeInput,
      output: ToolExecuteBeforeOutput,
    ) => {
      const reason = findDenyReason(input.tool, output.args, directory);
      if (reason) {
        throw new Error(reason);
      }
    },
  };
};
