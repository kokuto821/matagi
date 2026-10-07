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
 * 安全性: ソースツリー（plugins/matagi）を破壊しないため、
 * - 出力先（realpath 解決後を含む）がソースツリー配下・同一なら中止する
 * - 張り直し対象が symlink 以外（実ファイル・実ディレクトリ）なら削除せずエラーにする
 *
 * 実行方法: node --experimental-strip-types link-source-dirs.ts <出力先ディレクトリ（例: <repo>/.codex）>
 */

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  assertOutsideSource,
  isDirectRun,
  isInsideOrSame,
  parseOutputDirArgs,
  realpathNonStrict,
} from "../shared.ts";

// 既存テストが本モジュールから import しているため、共通化した関数を再エクスポートして互換を保つ
export { assertOutsideSource, realpathNonStrict };

const SOURCE_PLUGIN_ROOT = join(import.meta.dirname, "../../");

/** 既存の symlink のみ除去して symlink を張り直す。symlink 以外が存在する場合は削除せず Error を投げる。 */
export const relink = (linkPath: string, targetPath: string): void => {
  const stat = lstatSync(linkPath, { throwIfNoEntry: false });
  if (stat !== undefined) {
    if (!stat.isSymbolicLink()) {
      throw new Error(
        `symlink ではない既存のパスがあるため上書きしません。手動で退避・削除してください: ${linkPath}`,
      );
    }
    unlinkSync(linkPath);
  }
  symlinkSync(targetPath, linkPath, "dir");
};

/** plugins/matagi/skills/ 配下のスキルディレクトリ名一覧を返す（README.md 等のファイルは除く）。 */
export const listSkillNames = (skillsSourceDir: string): string[] => {
  return readdirSync(skillsSourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

/** ソースの skills/ を指すが、現在のスキル名一覧に無い（ソースから削除済みの）symlink を除去し、除去した名前を返す。 */
export const removeStaleSkillLinks = (
  skillsOutputDir: string,
  skillsSourceDir: string,
  currentSkillNames: string[],
): string[] => {
  const removed: string[] = [];
  const sourceRoot = realpathNonStrict(skillsSourceDir);
  for (const entry of readdirSync(skillsOutputDir, { withFileTypes: true })) {
    if (!entry.isSymbolicLink() || currentSkillNames.includes(entry.name)) {
      continue;
    }
    const linkPath = join(skillsOutputDir, entry.name);
    const linkTarget = resolve(skillsOutputDir, readlinkSync(linkPath));
    if (isInsideOrSame(realpathNonStrict(linkTarget), sourceRoot)) {
      unlinkSync(linkPath);
      removed.push(entry.name);
    }
  }
  return removed;
};

/** hooks/ と skills/<name> を出力先へ symlink する。生成したスキル symlink 数を返す。 */
export const linkSourceDirs = (
  outputDir: string,
  pluginRootDir: string = SOURCE_PLUGIN_ROOT,
): number => {
  const codexRoot = resolve(outputDir);
  const pluginRoot = resolve(pluginRootDir);
  assertOutsideSource(codexRoot, pluginRoot);
  mkdirSync(codexRoot, { recursive: true });

  // hooks/ は config.toml が参照するスクリプト本体のため、ディレクトリごと symlink する
  relink(join(codexRoot, "hooks"), join(pluginRoot, "hooks"));

  const skillsSourceDir = join(pluginRoot, "skills");
  const skillsOutputDir = join(codexRoot, "skills");
  mkdirSync(skillsOutputDir, { recursive: true });
  // skills/ 自体がソース側への symlink だと、配下の symlink 張り替えがソースを書き換えてしまう
  assertOutsideSource(skillsOutputDir, pluginRoot);

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
      `Codex 向け hooks/ symlink と skills symlink を ${count} 件生成しました: ${resolve(outputDir)}`,
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
