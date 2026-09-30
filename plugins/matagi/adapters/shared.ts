/**
 * アダプタ（antigravity / codex）の各 generate-*.ts / link-source-dirs.ts で共有するユーティリティ。
 *
 * Claude Code 向け plugin.json の読み込み（antigravity / codex 共通）、出力先マニフェストの
 * 書き出し（ディレクトリ作成・JSON整形・完了ログ出力。antigravity 用）、および
 * 「直接実行された場合のみ main を走らせる」判定のみを担う。変換ロジックは各スクリプト側に残す。
 */

import { readFileSync, realpathSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_PLUGIN_JSON = join(
  import.meta.dirname,
  "../.claude-plugin/plugin.json",
);

export const readClaudePluginJson = <T>(): T => {
  return JSON.parse(readFileSync(SOURCE_PLUGIN_JSON, "utf-8")) as T;
};

export const writeManifest = (
  outputPath: string,
  data: unknown,
  label: string,
): void => {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");

  console.log(`${label} を出力しました: ${outputPath}`);
};

/**
 * モジュールがエントリポイントとして直接実行されたかを返す（import 時に main を走らせないためのガード）。
 * @param moduleUrl 呼び出し側モジュールの import.meta.url
 * @param entryPath 実行エントリのパス（既定: process.argv[1]）
 */
export const isDirectRun = (
  moduleUrl: string,
  entryPath: string | undefined = process.argv[1],
): boolean => {
  if (!entryPath) {
    return false;
  }
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(entryPath);
  } catch {
    return false;
  }
};

/** realpath 相当。存在しないパスは、実在する最も近い祖先を解決して残りを連結する。 */
export const realpathNonStrict = (path: string): string => {
  try {
    return realpathSync(path);
  } catch {
    const parent = dirname(path);
    if (parent === path) {
      return path;
    }
    return join(realpathNonStrict(parent), relative(parent, path));
  }
};

/** target が root と同一、または root 配下なら true（symlink は解決済みの実パス同士で比較する）。 */
export const isInsideOrSame = (target: string, root: string): boolean => {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel))
  );
};

/** 出力先がソースツリー配下・同一（realpath 後を含む）なら Error を投げる。 */
export const assertOutsideSource = (
  outputPath: string,
  sourceRoot: string,
): void => {
  if (
    isInsideOrSame(
      realpathNonStrict(resolve(outputPath)),
      realpathNonStrict(resolve(sourceRoot)),
    )
  ) {
    throw new Error(
      `出力先がソースツリー配下または同一のため中止します（ソース破壊防止）: ${outputPath}`,
    );
  }
};

/**
 * 「<出力先ディレクトリ> [許可オプション]」形式の CLI 引数を検証して返す。
 * 許可外の `-` 始まりオプション、位置引数の欠落・2個以上は Error（呼び出し側が使用法を表示して exit 1 する）。
 */
export const parseOutputDirArgs = <F extends string>(
  args: string[],
  allowedFlags: readonly F[] = [],
): { outputDir: string; flags: Set<F> } => {
  const flags = new Set<F>();
  const positionals: string[] = [];
  for (const arg of args) {
    if ((allowedFlags as readonly string[]).includes(arg)) {
      flags.add(arg as F);
    } else if (arg.startsWith("-")) {
      throw new Error(`未知のオプションです: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }
  if (positionals.length !== 1) {
    throw new Error(
      positionals.length === 0
        ? "出力先ディレクトリを指定してください"
        : `出力先ディレクトリは1つだけ指定してください: ${positionals.join(" ")}`,
    );
  }
  return { outputDir: positionals[0], flags };
};
