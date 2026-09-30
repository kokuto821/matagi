/**
 * Claude Code 向け plugin.json の `hooks` フィールドを Google Antigravity 向け hooks.json に変換するスクリプト。
 *
 * command 文字列（既存 hooks/*.ts への参照）はそのまま維持し、hooks/*.ts 本体には手を加えない。
 * hooks.json は Antigravity 仕様上プラグインルート直下に置く必要があるため、
 * 出力先ディレクトリ（= プラグインルート）を CLI 引数で必須指定する。
 * 実行方法: node --experimental-strip-types generate-hooks-json.ts <出力先ディレクトリ（プラグインルート）>
 */

import { join, resolve } from "node:path";
import { readClaudePluginJson, writeManifest } from "../shared.ts";

type ClaudeHookCommand = {
  type: string;
  command: string;
  timeout?: number;
};

type ClaudeHookMatcher = {
  matcher: string;
  hooks: ClaudeHookCommand[];
};

type ClaudePluginManifest = {
  hooks?: Record<string, ClaudeHookMatcher[]>;
};

// Antigravity hooks.json のフィールド名・イベント名は実機未検証、要実機確認
type AntigravityHookEntry = {
  event: string;
  matcher: string;
  command: string;
};

type AntigravityHooksManifest = {
  hooks: AntigravityHookEntry[];
};

const toAntigravityHooks = (
  source: ClaudePluginManifest,
  pluginRoot: string,
): AntigravityHooksManifest => {
  const entries: AntigravityHookEntry[] = [];
  for (const [event, matchers] of Object.entries(source.hooks ?? {})) {
    for (const { matcher, hooks } of matchers) {
      for (const hook of hooks) {
        // agy は ${...} 変数展開をサポートしないため絶対パスに置換する
        const command = hook.command.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot);
        entries.push({ event, matcher, command });
      }
    }
  }
  return { hooks: entries };
};

const main = () => {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("出力先ディレクトリ（プラグインルート）を指定してください");
    console.error(
      "実行方法: node --experimental-strip-types generate-hooks-json.ts <出力先ディレクトリ（プラグインルート）>",
    );
    process.exit(1);
  }

  const pluginRoot = resolve(outputDir);
  const outputPath = join(pluginRoot, "hooks.json");

  const source = readClaudePluginJson<ClaudePluginManifest>();
  const manifest = toAntigravityHooks(source, pluginRoot);

  writeManifest(outputPath, manifest, "Antigravity hooks.json");
};

main();
