/**
 * plugins/matagi/skills/ の各スキルと hooks プラグインを、OpenCode が読み込む設定ルート
 * （例: <repo>/.opencode）へ symlink するスクリプト。
 *
 * - `<出力先>/skills/<skill-name>` → `plugins/matagi/skills/<skill-name>`
 *   SKILL.md のフォーマットは OpenCode も同一（name はディレクトリ名と一致が必須）のため変換せず参照する。
 * - `<出力先>/plugins/matagi-hooks.ts` → `adapters/opencode/matagi-hooks.ts`
 *   hooks の実体（hooks/*.ts）は matagi-hooks.ts が相対参照するため、hooks/ 自体の symlink は不要。
 *
 * 安全性は codex の link-source-dirs.ts と同じ（出力先がソースツリー配下・同一なら中止、
 * symlink 以外の既存物は削除せずエラー）。
 *
 * 実行方法: node --experimental-strip-types link-source-dirs.ts <出力先ディレクトリ（例: <repo>/.opencode）>
 */

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  listSkillNames,
  relink,
  removeStaleSkillLinks,
} from "../codex/link-source-dirs.ts";
import {
  assertOutsideSource,
  isDirectRun,
  parseOutputDirArgs,
} from "../shared.ts";

const SOURCE_PLUGIN_ROOT = join(import.meta.dirname, "../../");
const HOOKS_PLUGIN_ENTRY = join(import.meta.dirname, "matagi-hooks.ts");

/** skills/<name> と plugins/matagi-hooks.ts を出力先へ symlink する。生成したスキル symlink 数を返す。 */
export const linkSourceDirs = (
  outputDir: string,
  pluginRootDir: string = SOURCE_PLUGIN_ROOT,
  hooksPluginEntry: string = HOOKS_PLUGIN_ENTRY,
): number => {
  const configRoot = resolve(outputDir);
  const pluginRoot = resolve(pluginRootDir);
  assertOutsideSource(configRoot, pluginRoot);

  const pluginsOutputDir = join(configRoot, "plugins");
  const skillsSourceDir = join(pluginRoot, "skills");
  const skillsOutputDir = join(configRoot, "skills");
  mkdirSync(pluginsOutputDir, { recursive: true });
  mkdirSync(skillsOutputDir, { recursive: true });
  // 出力先ディレクトリ自体がソース側への symlink だと、配下の張り替えがソースを書き換えてしまう
  assertOutsideSource(pluginsOutputDir, pluginRoot);
  assertOutsideSource(skillsOutputDir, pluginRoot);

  relink(join(pluginsOutputDir, "matagi-hooks.ts"), hooksPluginEntry);

  const skillNames = listSkillNames(skillsSourceDir);
  removeStaleSkillLinks(skillsOutputDir, skillsSourceDir, skillNames);
  for (const name of skillNames) {
    relink(join(skillsOutputDir, name), join(skillsSourceDir, name));
  }
  return skillNames.length;
};

const main = () => {
  try {
    const { outputDir } = parseOutputDirArgs(process.argv.slice(2));
    const count = linkSourceDirs(outputDir);
    console.log(
      `OpenCode 向け hooks プラグイン symlink と skills symlink を ${count} 件生成しました: ${resolve(outputDir)}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      "実行方法: node --experimental-strip-types link-source-dirs.ts <出力先ディレクトリ>",
    );
    process.exit(1);
  }
};

if (isDirectRun(import.meta.url)) {
  main();
}
