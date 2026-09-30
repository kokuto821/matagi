/**
 * plugins/matagi/agents/*.md（Markdown + frontmatter）を、
 * Codex CLI のカスタムエージェント定義 <出力先>/agents/<name>.toml へ変換するスクリプト。
 *
 * マッピング: frontmatter の name → name / description → description、
 * frontmatter 以降の本文 → developer_instructions（Codex の必須3フィールド）。
 * frontmatter を持たないファイル（README.md 等）のみ変換対象外として静かに読み飛ばす。
 * frontmatter があるのに name / description 欠落・name 不正・name 重複はエラーで中止する。
 *
 * 実行方法: node --experimental-strip-types generate-agents-toml.ts <出力先ディレクトリ（例: <repo>/.codex）>
 */

import { join, resolve } from "node:path";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import {
  assertOutsideSource,
  isDirectRun,
  parseOutputDirArgs,
} from "../shared.ts";
import { tomlMultilineString, tomlString } from "./toml.ts";

const SOURCE_PLUGIN_ROOT = join(import.meta.dirname, "../../");
const SOURCE_AGENTS_DIR = join(SOURCE_PLUGIN_ROOT, "agents");

// 先頭の `---` で囲まれた frontmatter と、それ以降の本文
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/;

export type AgentDefinition = {
  name: string;
  description: string;
  instructions: string;
};

// 出力ファイル名 <name>.toml になるため、パス区切り等を含められない安全な文字種に限定する
const AGENT_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * 単一行 `key: value` 形式の frontmatter から指定キーの値を取り出す。キーが無ければ null。
 * 値が空、ブロックスカラー（`|` `>` 始まり）、引用符付きの場合は未対応形式として Error を投げる。
 */
export const frontmatterValue = (
  frontmatter: string,
  key: string,
): string | null => {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  if (!match) {
    return null;
  }
  const value = match[1].trim();
  if (value === "" || /^[|>"']/.test(value)) {
    throw new Error(
      `未対応の frontmatter 形式です（${key}: は単一行の引用符なしプレーン値のみ対応）`,
    );
  }
  return value;
};

/**
 * Markdown 1ファイルを AgentDefinition に変換する。
 * frontmatter が無ければ null（README.md 等。静かに変換対象外）。
 * frontmatter があるのに name / description が欠落、または name が不正なら Error を投げる。
 * @param label エラーメッセージ用のファイル名
 */
export const parseAgent = (
  source: string,
  label: string = "(unknown)",
): AgentDefinition | null => {
  const match = source.replaceAll("\r\n", "\n").match(FRONTMATTER_PATTERN);
  if (!match) {
    return null;
  }
  let name: string | null;
  let description: string | null;
  try {
    name = frontmatterValue(match[1], "name");
    description = frontmatterValue(match[1], "description");
  } catch (error) {
    throw new Error(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!name || !description) {
    throw new Error(
      `${label}: frontmatter に name / description の両方が必要です`,
    );
  }
  if (!AGENT_NAME_PATTERN.test(name)) {
    throw new Error(
      `${label}: name は ${AGENT_NAME_PATTERN} に一致する必要があります: ${name}`,
    );
  }
  return { name, description, instructions: match[2].trim() + "\n" };
};

/** 複数ファイルを変換し、frontmatter 無しは除外する。name が重複したら Error を投げる。 */
export const parseAgents = (
  sources: { file: string; content: string }[],
): AgentDefinition[] => {
  const agents: AgentDefinition[] = [];
  const fileByName = new Map<string, string>();
  for (const { file, content } of sources) {
    const agent = parseAgent(content, file);
    if (agent === null) {
      continue;
    }
    const existing = fileByName.get(agent.name);
    if (existing !== undefined) {
      throw new Error(
        `agent name "${agent.name}" が重複しています: ${existing} / ${file}`,
      );
    }
    fileByName.set(agent.name, file);
    agents.push(agent);
  }
  return agents;
};

export const toAgentToml = ({
  name,
  description,
  instructions,
}: AgentDefinition): string => {
  return [
    `name = ${tomlString(name)}`,
    `description = ${tomlString(description)}`,
    `developer_instructions = ${tomlMultilineString(instructions)}`,
    "",
  ].join("\n");
};

/** agentsSourceDir の *.md を <outputDir>/agents/<name>.toml へ変換する。出力件数を返す。 */
export const generateAgentsToml = (
  outputDir: string,
  agentsSourceDir: string = SOURCE_AGENTS_DIR,
  pluginRootDir: string = SOURCE_PLUGIN_ROOT,
): number => {
  assertOutsideSource(outputDir, pluginRootDir);
  const sources = readdirSync(agentsSourceDir)
    .filter((name) => name.endsWith(".md"))
    .map((file) => ({
      file,
      content: readFileSync(join(agentsSourceDir, file), "utf-8"),
    }));
  // 全件の検証が済んでから書き出す（途中失敗で中途半端な出力を残さない）
  const agents = parseAgents(sources);

  const agentsOutputDir = join(resolve(outputDir), "agents");
  mkdirSync(agentsOutputDir, { recursive: true });
  for (const agent of agents) {
    writeFileSync(
      join(agentsOutputDir, `${agent.name}.toml`),
      toAgentToml(agent),
    );
  }
  return agents.length;
};

const main = () => {
  try {
    const { outputDir } = parseOutputDirArgs(process.argv.slice(2));
    const count = generateAgentsToml(outputDir);
    console.log(
      `Codex 向け agents TOML を ${count} 件出力しました: ${join(resolve(outputDir), "agents")}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      "実行方法: node --experimental-strip-types generate-agents-toml.ts <出力先ディレクトリ>",
    );
    process.exit(1);
  }
};

if (isDirectRun(import.meta.url)) {
  main();
}
