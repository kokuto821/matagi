/**
 * plugins/matagi/skills/ と plugins/matagi/hooks/ の配下を、
 * Codex CLI が読み込む <出力先>/skills/<skill-name> と <出力先>/hooks へ symlink するスクリプト。
 *
 * Codex はプラグイン単位のバンドルを持たず、`.codex/skills/<name>/SKILL.md` を
 * スキル単位で読み込む（issue #55 調査）。SKILL.md のフォーマット自体は
 * cross-agent standard で Claude Code とほぼ同一のため、変換せず複製もせず
 * symlink で参照する。hooks は generate-hooks-config.ts が生成する config.toml が
 * `<出力先>/hooks/*.ts` を指すため、hooks/ 本体もあわせて symlink する。
 *
 * 実行方法: node --experimental-strip-types link-skills.ts <出力先ディレクトリ（例: <repo>/.codex）>
 */

import { join, resolve } from "node:path";
import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";

const SOURCE_PLUGIN_ROOT = join(import.meta.dirname, "../../");

/** 既存のパス（symlink・ファイル・ディレクトリいずれも）を除去してから symlink を張り直す。 */
const relink = (linkPath: string, targetPath: string): void => {
  if (existsSync(linkPath) || lstatSync(linkPath, { throwIfNoEntry: false })) {
    rmSync(linkPath, { recursive: true, force: true });
  }
  symlinkSync(targetPath, linkPath, "dir");
};

/** plugins/matagi/skills/ 配下のスキルディレクトリ名一覧を返す（README.md 等のファイルは除く）。 */
const listSkillNames = (skillsSourceDir: string): string[] => {
  return readdirSync(skillsSourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

const main = () => {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("出力先ディレクトリ（Codex 設定ルート）を指定してください");
    console.error("実行方法: node --experimental-strip-types link-skills.ts <出力先ディレクトリ>");
    process.exit(1);
  }

  const codexRoot = resolve(outputDir);
  const pluginRoot = resolve(SOURCE_PLUGIN_ROOT);
  mkdirSync(codexRoot, { recursive: true });

  // hooks/ は config.toml が参照するスクリプト本体のため、ディレクトリごと symlink する
  relink(join(codexRoot, "hooks"), join(pluginRoot, "hooks"));

  const skillsSourceDir = join(pluginRoot, "skills");
  const skillsOutputDir = join(codexRoot, "skills");
  mkdirSync(skillsOutputDir, { recursive: true });

  const skillNames = listSkillNames(skillsSourceDir);
  for (const name of skillNames) {
    relink(join(skillsOutputDir, name), join(skillsSourceDir, name));
  }

  console.log(`Codex 向け hooks/ symlink と skills symlink を ${skillNames.length} 件生成しました: ${codexRoot}`);
};

main();
