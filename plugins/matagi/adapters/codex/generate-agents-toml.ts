/**
 * plugins/matagi/agents/*.md（Markdown + frontmatter）を、
 * Codex CLI のカスタムエージェント定義 <出力先>/agents/<name>.toml へ変換するスクリプト。
 *
 * マッピング: frontmatter の name → name / description → description、
 * frontmatter 以降の本文 → developer_instructions（Codex の必須3フィールド）。
 * frontmatter を持たないファイル（README.md 等）は変換対象外として読み飛ばす。
 *
 * 実行方法: node --experimental-strip-types generate-agents-toml.ts <出力先ディレクトリ（例: <repo>/.codex）>
 */

import { join, resolve } from "node:path";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tomlMultilineString, tomlString } from "./toml.ts";

const SOURCE_AGENTS_DIR = join(import.meta.dirname, "../../agents");

// 先頭の `---` で囲まれた frontmatter と、それ以降の本文
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

type AgentDefinition = { name: string; description: string; instructions: string };

/** 単一行 `key: value` 形式の frontmatter から指定キーの値を取り出す。 */
const frontmatterValue = (frontmatter: string, key: string): string | null => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : null;
};

/** frontmatter に name / description が揃っていなければ null（変換対象外）。 */
const parseAgent = (source: string): AgentDefinition | null => {
  const match = source.match(FRONTMATTER_PATTERN);
  if (!match) {
    return null;
  }
  const name = frontmatterValue(match[1], "name");
  const description = frontmatterValue(match[1], "description");
  if (!name || !description) {
    return null;
  }
  return { name, description, instructions: match[2].trim() + "\n" };
};

const toAgentToml = ({ name, description, instructions }: AgentDefinition): string => {
  return [
    `name = ${tomlString(name)}`,
    `description = ${tomlString(description)}`,
    `developer_instructions = ${tomlMultilineString(instructions)}`,
    "",
  ].join("\n");
};

const main = () => {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("出力先ディレクトリ（Codex 設定ルート）を指定してください");
    console.error("実行方法: node --experimental-strip-types generate-agents-toml.ts <出力先ディレクトリ>");
    process.exit(1);
  }

  const agentsOutputDir = join(resolve(outputDir), "agents");
  mkdirSync(agentsOutputDir, { recursive: true });

  let converted = 0;
  for (const file of readdirSync(SOURCE_AGENTS_DIR).filter((name) => name.endsWith(".md"))) {
    const agent = parseAgent(readFileSync(join(SOURCE_AGENTS_DIR, file), "utf-8"));
    if (agent === null) {
      continue;
    }
    writeFileSync(join(agentsOutputDir, `${agent.name}.toml`), toAgentToml(agent));
    converted += 1;
  }

  console.log(`Codex 向け agents TOML を ${converted} 件出力しました: ${agentsOutputDir}`);
};

main();
