/**
 * Claude Code 向け plugin.json を Google Antigravity 向け plugin.json に変換するスクリプト。
 *
 * Antigravity の plugin.json は必須 `name`（`^[a-zA-Z0-9-_]+$`）、任意 `description`、
 * 任意 `$schema` のみを持ち、`hooks` フィールドは持たない（hooks は hooks.json で別管理）。
 * plugin.json は Antigravity 仕様上プラグインルート直下に置く必要があるため、
 * 出力先ディレクトリ（= プラグインルート）を CLI 引数で必須指定する（generate-hooks-json.ts と方針を揃える）。
 * 実行方法: node --experimental-strip-types generate-plugin-json.ts <出力先ディレクトリ（プラグインルート）>
 */

import { join, resolve } from "node:path";
import { readClaudePluginJson, writeManifest } from "../shared.ts";

type ClaudePluginManifest = {
  name: string;
  description?: string;
};

type AntigravityPluginManifest = {
  name: string;
  description?: string;
};

const toAntigravityManifest = (source: ClaudePluginManifest): AntigravityPluginManifest => {
  const manifest: AntigravityPluginManifest = { name: source.name };
  if (source.description !== undefined) {
    manifest.description = source.description;
  }
  return manifest;
};

const main = () => {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("出力先ディレクトリ（プラグインルート）を指定してください");
    console.error(
      "実行方法: node --experimental-strip-types generate-plugin-json.ts <出力先ディレクトリ（プラグインルート）>",
    );
    process.exit(1);
  }

  const outputPath = join(resolve(outputDir), "plugin.json");

  const source = readClaudePluginJson<ClaudePluginManifest>();
  const manifest = toAntigravityManifest(source);

  writeManifest(outputPath, manifest, "Antigravity plugin.json");
};

main();
