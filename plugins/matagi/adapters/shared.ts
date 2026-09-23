/**
 * generate-plugin-json.ts / generate-hooks-json.ts の main() 定型処理を切り出した共通ユーティリティ。
 *
 * Claude Code 向け plugin.json の読み込みと、出力先マニフェストの書き出し（ディレクトリ作成・
 * JSON整形・完了ログ出力）のみを担う。変換ロジック（toAntigravityManifest / toAntigravityHooks）
 * は各スクリプト側に残す。
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const SOURCE_PLUGIN_JSON = join(import.meta.dirname, "../.claude-plugin/plugin.json");

export const readClaudePluginJson = <T>(): T => {
  return JSON.parse(readFileSync(SOURCE_PLUGIN_JSON, "utf-8")) as T;
};

export const writeManifest = (outputPath: string, data: unknown, label: string): void => {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");

  console.log(`${label} を出力しました: ${outputPath}`);
};
