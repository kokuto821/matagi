/**
 * Claude Code 向け plugin.json の `hooks` フィールドを Codex CLI 向け config.toml の
 * `[[hooks.<event>]]` テーブルに変換するスクリプト。
 *
 * command 文字列（既存 hooks/*.ts への参照）はそのまま維持し、hooks/*.ts 本体には手を加えない。
 * Codex は `${CLAUDE_PLUGIN_ROOT}` 変数展開をサポートしないため、出力先ディレクトリ
 * （= プラグインルート）を CLI 引数で必須指定し、絶対パスに置換して書き出す。
 *
 * matcher は Claude Code のツール名（Edit/Write/NotebookEdit）をそのまま複製しない。
 * Codex のツール体系は Bash / apply_patch / MCP 名のみで、対応するツール名が無い個別
 * ケースがあるため、hook スクリプトのファイル名単位で CODEX_MATCHER_OVERRIDES に
 * Codex 向け matcher を明示する（無いものは Codex 上で意味を持たないため出力対象から除く）。
 * 実行方法: node --experimental-strip-types generate-hooks-config.ts <出力先ディレクトリ（プラグインルート）>
 */

import { basename, join, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { readClaudePluginJson } from "../shared.ts";

// hook スクリプトのファイル名 → Codex 向け matcher（正規表現文字列）。
// protected-branch-guard.ts: 保護ブランチ上の変更を拒否する。Codex のファイル編集は
//   apply_patch 経由のため Bash に加え apply_patch も対象にする（既存 TS 側で対応済み）。
// pr-merge-guard.ts: `gh pr merge`（Bash 経由）を拒否する。ファイル編集ツールは無関係。
// antigravity-manifest-sync.ts: Antigravity 専用の同期処理のため Codex には出力しない。
const CODEX_MATCHER_OVERRIDES: Record<string, string> = {
  "protected-branch-guard.ts": "Bash|apply_patch",
  "pr-merge-guard.ts": "Bash",
};

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

type CodexHookEntry = {
  event: string;
  matcher: string;
  command: string;
  timeout?: number;
};

/** command 文字列から呼び出し対象の hook スクリプトファイル名を抽出する。抽出できなければ null。 */
const hookScriptName = (command: string): string | null => {
  const match = command.match(/"([^"]+\.ts)"/);
  return match ? basename(match[1]) : null;
};

const toCodexHookEntries = (source: ClaudePluginManifest, pluginRoot: string): CodexHookEntry[] => {
  const entries: CodexHookEntry[] = [];
  for (const [event, matchers] of Object.entries(source.hooks ?? {})) {
    for (const { hooks } of matchers) {
      for (const hook of hooks) {
        const scriptName = hookScriptName(hook.command);
        const codexMatcher = scriptName ? CODEX_MATCHER_OVERRIDES[scriptName] : undefined;
        if (codexMatcher === undefined) {
          continue;
        }
        // Codex は ${...} 変数展開をサポートしないため絶対パスに置換する
        const command = hook.command.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot);
        const entry: CodexHookEntry = { event, matcher: codexMatcher, command };
        if (hook.timeout !== undefined) {
          entry.timeout = hook.timeout;
        }
        entries.push(entry);
      }
    }
  }
  return entries;
};

const tomlString = (value: string): string => {
  // TOML basic string のエスケープ対象（バックスラッシュ・二重引用符・制御文字）のみ扱う
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\t", "\\t");
  return `"${escaped}"`;
};

const toConfigToml = (entries: CodexHookEntry[]): string => {
  const blocks = entries.map((entry) => {
    const lines = [
      `[[hooks.${entry.event}]]`,
      `matcher = ${tomlString(entry.matcher)}`,
      "",
      `[[hooks.${entry.event}.hooks]]`,
      `type = "command"`,
      `command = ${tomlString(entry.command)}`,
    ];
    if (entry.timeout !== undefined) {
      lines.push(`timeout = ${entry.timeout}`);
    }
    return lines.join("\n");
  });
  return blocks.join("\n\n") + "\n";
};

const main = () => {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("出力先ディレクトリ（プラグインルート）を指定してください");
    console.error(
      "実行方法: node --experimental-strip-types generate-hooks-config.ts <出力先ディレクトリ（プラグインルート）>",
    );
    process.exit(1);
  }

  const pluginRoot = resolve(outputDir);
  const outputPath = join(pluginRoot, "config.toml");

  const source = readClaudePluginJson<ClaudePluginManifest>();
  const entries = toCodexHookEntries(source, pluginRoot);
  const toml = toConfigToml(entries);

  mkdirSync(pluginRoot, { recursive: true });
  writeFileSync(outputPath, toml);

  console.log(`Codex config.toml（hooks）を出力しました: ${outputPath}`);
};

main();
