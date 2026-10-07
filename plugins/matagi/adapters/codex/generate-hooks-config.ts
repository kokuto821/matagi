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
 *
 * 安全性:
 * - 出力先の絶対パスは `"..."` 内のシェルコマンドに埋め込まれるため、`"` `$` `` ` `` `\` や制御文字を
 *   含むパスは拒否する。event 名は TOML の bare key に使うため /^[A-Za-z0-9_-]+$/ で検証する。
 * - plugin.json に、Codex 向け matcher も意図的除外も定義されていないフックがあれば失敗させる
 *   （新フックの黙った脱落を防ぐ）。protected-branch-guard が出力に無い場合も失敗させる。
 * - 既存の <出力先>/config.toml（壊れた symlink を含む）は --force 指定が無ければ上書きせず失敗する。
 *   --force は config.toml 全体の置換であり、Codex の他の設定も失われる。
 *   書き込みは同一ディレクトリの一時ファイル経由の renameSync 置換で、既存が symlink / ハードリンクでも
 *   リンク先の inode は書き換えず config.toml のエントリだけを差し替える（部分書き込みも残さない）。
 *   通常ファイルでも symlink でもない既存（ディレクトリ等）は --force でも拒否する。
 * - 出力先がソースツリー（plugins/matagi）配下・同一なら中止する。
 *
 * 実行方法: node --experimental-strip-types generate-hooks-config.ts <出力先ディレクトリ（プラグインルート）> [--force]
 */

import { lstatSync, mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  assertOutsideSource,
  assertReplaceableOutput,
  isDirectRun,
  parseOutputDirArgs,
  readClaudePluginJson,
  writeFileReplacing,
} from "../shared.ts";
import { tomlString } from "./toml.ts";

// hook スクリプトのファイル名 → Codex 向け matcher（正規表現文字列）。
// protected-branch-guard.ts: 保護ブランチ上の変更を拒否する。Codex のファイル編集は
//   apply_patch 経由のため Bash に加え apply_patch も対象にする（既存 TS 側で対応済み）。
// pr-merge-guard.ts: `gh pr merge`（Bash 経由）を拒否する。ファイル編集ツールは無関係。
// antigravity-manifest-sync.ts: Antigravity 専用の同期処理のため Codex には出力しない
//   （INTENTIONALLY_EXCLUDED_SCRIPTS）。
const CODEX_MATCHER_OVERRIDES: Record<string, string> = {
  "protected-branch-guard.ts": "Bash|apply_patch",
  "pr-merge-guard.ts": "Bash",
};

// Codex へ意図的に出力しないフック。ここにも CODEX_MATCHER_OVERRIDES にも無いフックは未対応としてエラーにする
const INTENTIONALLY_EXCLUDED_SCRIPTS = new Set([
  "antigravity-manifest-sync.ts",
]);

// 出力に必ず含まれていなければならないフック（欠落＝保護が黙って外れるため失敗させる）
const REQUIRED_SCRIPT = "protected-branch-guard.ts";

const SOURCE_PLUGIN_ROOT = join(import.meta.dirname, "../../");

const EVENT_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
// ダブルクォート内のシェル展開・脱出に使われる文字と制御文字
const SHELL_UNSAFE_PATH_PATTERN = /["$`\\\u0000-\u001F\u007F]/;

export type ClaudeHookCommand = {
  type: string;
  command: string;
  timeout?: number;
};

export type ClaudeHookMatcher = {
  matcher: string;
  hooks: ClaudeHookCommand[];
};

export type ClaudePluginManifest = {
  hooks?: Record<string, ClaudeHookMatcher[]>;
};

export type CodexHookEntry = {
  event: string;
  matcher: string;
  command: string;
  timeout?: number;
};

/** command 文字列から呼び出し対象の hook スクリプトファイル名を抽出する。抽出できなければ null。 */
export const hookScriptName = (command: string): string | null => {
  const match = command.match(/"([^"]+\.ts)"/);
  return match ? basename(match[1]) : null;
};

/** pluginRoot が `"..."` 内のシェルコマンドへ安全に埋め込めなければ Error を投げる。 */
export const assertShellSafePath = (path: string): void => {
  if (SHELL_UNSAFE_PATH_PATTERN.test(path)) {
    throw new Error(
      `出力先パスにシェルで安全に扱えない文字（" $ \` \\ 制御文字）が含まれています: ${JSON.stringify(path)}`,
    );
  }
};

/**
 * plugin.json の hooks を Codex 向けエントリへ変換する。
 * 不正な event 名、未対応（matcher 未定義かつ意図的除外でもない）のフック、
 * protected-branch-guard の欠落（0件を含む）は Error を投げる。
 */
export const toCodexHookEntries = (
  source: ClaudePluginManifest,
  pluginRoot: string,
): CodexHookEntry[] => {
  assertShellSafePath(pluginRoot);

  const entries: CodexHookEntry[] = [];
  const unsupported: string[] = [];
  for (const [event, matchers] of Object.entries(source.hooks ?? {})) {
    if (!EVENT_NAME_PATTERN.test(event)) {
      throw new Error(
        `event 名は ${EVENT_NAME_PATTERN} に一致する必要があります: ${JSON.stringify(event)}`,
      );
    }
    for (const { hooks } of matchers) {
      for (const hook of hooks) {
        const scriptName = hookScriptName(hook.command);
        if (
          scriptName !== null &&
          INTENTIONALLY_EXCLUDED_SCRIPTS.has(scriptName)
        ) {
          continue;
        }
        const codexMatcher =
          scriptName === null ? undefined : CODEX_MATCHER_OVERRIDES[scriptName];
        if (codexMatcher === undefined) {
          unsupported.push(`${event}: ${scriptName ?? hook.command}`);
          continue;
        }
        // Codex は ${...} 変数展開をサポートしないため絶対パスに置換する
        const command = hook.command.replaceAll(
          "${CLAUDE_PLUGIN_ROOT}",
          pluginRoot,
        );
        const entry: CodexHookEntry = { event, matcher: codexMatcher, command };
        if (hook.timeout !== undefined) {
          entry.timeout = hook.timeout;
        }
        entries.push(entry);
      }
    }
  }

  if (unsupported.length > 0) {
    throw new Error(
      `Codex 向け matcher（CODEX_MATCHER_OVERRIDES）も意図的除外（INTENTIONALLY_EXCLUDED_SCRIPTS）も未定義のフックがあります: ${unsupported.join(", ")}`,
    );
  }
  if (
    !entries.some((entry) => hookScriptName(entry.command) === REQUIRED_SCRIPT)
  ) {
    throw new Error(
      `${REQUIRED_SCRIPT} のエントリが出力に含まれません（plugin.json の hooks を確認してください）`,
    );
  }
  return entries;
};

export const toConfigToml = (entries: CodexHookEntry[]): string => {
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

/** config.toml を <outputDir>/config.toml へ書き出す。既存ファイルは force 無しでは Error。出力パスを返す。 */
export const generateHooksConfig = (
  outputDir: string,
  options: { force?: boolean } = {},
  source: ClaudePluginManifest = readClaudePluginJson<ClaudePluginManifest>(),
  sourcePluginRoot: string = SOURCE_PLUGIN_ROOT,
): string => {
  const pluginRoot = resolve(outputDir);
  assertOutsideSource(pluginRoot, sourcePluginRoot);
  const outputPath = join(pluginRoot, "config.toml");

  // 変換（検証）を先に行い、失敗時に何も書かない
  const toml = toConfigToml(toCodexHookEntries(source, pluginRoot));

  if (
    lstatSync(outputPath, { throwIfNoEntry: false }) !== undefined &&
    !options.force
  ) {
    throw new Error(
      `${outputPath} が既に存在します。上書きするには --force を指定してください`,
    );
  }
  assertReplaceableOutput(outputPath);
  mkdirSync(pluginRoot, { recursive: true });
  // symlink 越しに書くとリンク先（ソースツリー内のファイル等）を上書きしてしまうため、
  // 一時ファイルへ書いて rename で config.toml のエントリ自体を置換する
  writeFileReplacing(outputPath, toml);
  return outputPath;
};

const USAGE = [
  "実行方法: node --experimental-strip-types generate-hooks-config.ts <出力先ディレクトリ（プラグインルート）> [--force]",
  "  --force: 既存の <出力先>/config.toml を置換する（Codex の他の設定も消える。指定が無ければ既存時は失敗）",
];

const main = () => {
  try {
    const { outputDir, flags } = parseOutputDirArgs(process.argv.slice(2), [
      "--force",
    ]);
    const outputPath = generateHooksConfig(outputDir, {
      force: flags.has("--force"),
    });
    console.log(`Codex config.toml（hooks）を出力しました: ${outputPath}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    USAGE.forEach((line) => console.error(line));
    process.exit(1);
  }
};

if (isDirectRun(import.meta.url)) {
  main();
}
