// Run: vitest run (plugins/matagi/ 配下)
// generate-agents-toml.ts の上書き拒否・古い生成物の削除・symlink 安全性・frontmatter 字下げ継続の検証。

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import { parseOutputDirArgs } from "../../shared.ts";
import {
  frontmatterValue,
  GENERATED_MARKER,
  generateAgentsToml,
  parseAgent,
  parseAgents,
  toAgentToml,
} from "../generate-agents-toml.ts";

const agentMd = (name: string, description: string, body = "本文\n") =>
  `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;

/** ソース md（agent-a / agent-b）を持つ擬似プラグインルートと出力先を作る。 */
const setup = () => {
  const root = makeTempDir("agents-toml-root-");
  const agentsDir = join(root, "agents");
  mkdirSync(agentsDir);
  writeFileSync(join(agentsDir, "a.md"), agentMd("agent-a", "A", "指示A\n"));
  writeFileSync(join(agentsDir, "b.md"), agentMd("agent-b", "B", "指示B\n"));
  const out = makeTempDir("agents-toml-out-");
  const outAgents = join(out, "agents");
  mkdirSync(outAgents);
  return { root, agentsDir, out, outAgents };
};

const generatedA = toAgentToml({
  name: "agent-a",
  description: "A",
  instructions: "指示A\n",
});

test("generateAgentsToml: 内容が異なる既存 toml があり force 無しなら既存パス入りの Error にし他も書かない", () => {
  const { root, agentsDir, out, outAgents } = setup();
  const existing = join(outAgents, "agent-b.toml");
  writeFileSync(existing, "user custom\n");

  expect(() => generateAgentsToml(out, agentsDir, root)).toThrow(
    new RegExp(existing.replaceAll(".", "\\.")),
  );

  expect(readFileSync(existing, "utf-8")).toBe("user custom\n");
  expect(existsSync(join(outAgents, "agent-a.toml"))).toBe(false);
});

test("generateAgentsToml: 既存が同内容なら force 無しでも冪等に成功する", () => {
  const { root, agentsDir, out, outAgents } = setup();
  writeFileSync(join(outAgents, "agent-a.toml"), generatedA);

  const result = generateAgentsToml(out, agentsDir, root);

  expect(result.count).toBe(2);
  expect(readFileSync(join(outAgents, "agent-a.toml"), "utf-8")).toBe(
    generatedA,
  );
});

test("generateAgentsToml: force 指定なら内容の異なる既存を上書きする", () => {
  const { root, agentsDir, out, outAgents } = setup();
  writeFileSync(join(outAgents, "agent-a.toml"), "user custom\n");

  generateAgentsToml(out, agentsDir, root, { force: true });

  expect(readFileSync(join(outAgents, "agent-a.toml"), "utf-8")).toBe(
    generatedA,
  );
});

test("generateAgentsToml: 既存が通常ファイルでない（ディレクトリ）なら force 無しで conflict にする", () => {
  const { root, agentsDir, out, outAgents } = setup();
  mkdirSync(join(outAgents, "agent-a.toml"));

  expect(() => generateAgentsToml(out, agentsDir, root)).toThrow(
    /agent-a\.toml/,
  );

  expect(existsSync(join(outAgents, "agent-b.toml"))).toBe(false);
});

test("parseOutputDirArgs: --force を allowedFlags に含めれば flags に入り出力先が取れる", () => {
  const { outputDir, flags } = parseOutputDirArgs(
    ["/some/out", "--force"],
    ["--force"],
  );

  expect(outputDir).toBe("/some/out");
  expect(flags.has("--force")).toBe(true);
});

test("parseOutputDirArgs: --force のみ（出力先なし）は Error にする", () => {
  expect(() => parseOutputDirArgs(["--force"], ["--force"])).toThrow(
    /出力先ディレクトリを指定/,
  );
});

test("parseOutputDirArgs: allowedFlags に無い --force は未知のオプションとして Error にする", () => {
  expect(() => parseOutputDirArgs(["/out", "--force"])).toThrow(/未知/);
});

test("generateAgentsToml: ソースに無い名前のマーカー付き toml は削除され removed に入る", () => {
  const { root, agentsDir, out, outAgents } = setup();
  writeFileSync(
    join(outAgents, "old-agent.toml"),
    `${GENERATED_MARKER}\nname = "old"\n`,
  );

  const { removed } = generateAgentsToml(out, agentsDir, root);

  expect(removed).toEqual(["old-agent"]);
  expect(existsSync(join(outAgents, "old-agent.toml"))).toBe(false);
});

test("generateAgentsToml: マーカーの無い toml は残り removed に入らない", () => {
  const { root, agentsDir, out, outAgents } = setup();
  writeFileSync(join(outAgents, "mine.toml"), 'name = "mine"\n');

  const { removed } = generateAgentsToml(out, agentsDir, root);

  expect(removed).toEqual([]);
  expect(readFileSync(join(outAgents, "mine.toml"), "utf-8")).toBe(
    'name = "mine"\n',
  );
});

test("generateAgentsToml: ソースに存在する名前の生成物は削除されない", () => {
  const { root, agentsDir, out, outAgents } = setup();

  const { removed } = generateAgentsToml(out, agentsDir, root);

  expect(removed).toEqual([]);
  expect(readdirSync(outAgents).sort()).toEqual([
    "agent-a.toml",
    "agent-b.toml",
  ]);
});

test("generateAgentsToml: マーカー付きでも symlink の toml は削除されない", () => {
  const { root, agentsDir, out, outAgents } = setup();
  const target = join(makeTempDir(), "target.toml");
  writeFileSync(target, `${GENERATED_MARKER}\nname = "x"\n`);
  symlinkSync(target, join(outAgents, "linked.toml"));

  const { removed } = generateAgentsToml(out, agentsDir, root);

  expect(removed).toEqual([]);
  expect(lstatSync(join(outAgents, "linked.toml")).isSymbolicLink()).toBe(true);
  expect(existsSync(target)).toBe(true);
});

test("generateAgentsToml: 生成物の先頭行は GENERATED_MARKER になる", () => {
  const { root, agentsDir, out, outAgents } = setup();

  generateAgentsToml(out, agentsDir, root);

  const firstLine = readFileSync(
    join(outAgents, "agent-a.toml"),
    "utf-8",
  ).split("\n")[0];
  expect(firstLine).toBe(GENERATED_MARKER);
});

test("generateAgentsToml: <出力先>/agents がソース内を指す symlink なら中止しソースに書かない", () => {
  const { root, agentsDir } = setup();
  const out = makeTempDir();
  symlinkSync(agentsDir, join(out, "agents"), "dir");

  expect(() => generateAgentsToml(out, agentsDir, root)).toThrow(
    /ソース破壊防止/,
  );

  expect(readdirSync(agentsDir).sort()).toEqual(["a.md", "b.md"]);
});

test("generateAgentsToml: 個々の toml がソース内ファイルへの symlink なら force でも中止しソース内ファイルは不変", () => {
  const { root, agentsDir, out, outAgents } = setup();
  const sourceFile = join(root, "precious.txt");
  writeFileSync(sourceFile, "original\n");
  symlinkSync(sourceFile, join(outAgents, "agent-a.toml"));

  expect(() =>
    generateAgentsToml(out, agentsDir, root, { force: true }),
  ).toThrow(/ソース破壊防止/);

  expect(readFileSync(sourceFile, "utf-8")).toBe("original\n");
  expect(existsSync(join(outAgents, "agent-b.toml"))).toBe(false);
});

test("frontmatterValue: 次行が字下げ継続なら未対応として Error にする", () => {
  expect(() =>
    frontmatterValue("description: foo\n  bar", "description"),
  ).toThrow(/未対応/);
});

test("parseAgent: description の字下げ継続はファイル名入りの Error にする", () => {
  expect(() =>
    parseAgent("---\nname: a\ndescription: foo\n  bar\n---\nbody\n", "x.md"),
  ).toThrow(/x\.md.*未対応/);
});

test("parseAgents: 字下げ継続を持つファイルがあればファイル名入りの Error にする", () => {
  const sources = [
    { file: "ok.md", content: agentMd("ok", "d") },
    {
      file: "multi.md",
      content: "---\nname: m\ndescription: foo\n\tbar\n---\nbody\n",
    },
  ];

  expect(() => parseAgents(sources)).toThrow(/multi\.md.*未対応/);
});

test("frontmatterValue: 字下げの無い次行（別キー）は従来どおり単一行として読める", () => {
  expect(frontmatterValue("description: foo\nname: bar", "description")).toBe(
    "foo",
  );
});

test("frontmatterValue: 次行が空行なら従来どおり単一行として読める", () => {
  expect(frontmatterValue("description: foo\n\nname: bar", "description")).toBe(
    "foo",
  );
});

test("実 agents/*.md の全12件が字下げ継続検査後も通る", () => {
  const agentsDir = join(import.meta.dirname, "../../../agents");
  const sources = readdirSync(agentsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      file,
      content: readFileSync(join(agentsDir, file), "utf-8"),
    }));

  expect(parseAgents(sources)).toHaveLength(12);
});

test("generateAgentsToml: ソース md が 0 件ならマーカー付き toml は削除されず staleCleanupSkipped が true", () => {
  const emptySource = makeTempDir("agents-empty-src-");
  const out = makeTempDir();
  const outAgents = join(out, "agents");
  mkdirSync(outAgents);
  const generated = join(outAgents, "old-agent.toml");
  writeFileSync(generated, `${GENERATED_MARKER}\nname = "old"\n`);

  const result = generateAgentsToml(out, emptySource);

  expect(result).toEqual({
    count: 0,
    removed: [],
    staleCleanupSkipped: true,
  });
  expect(existsSync(generated)).toBe(true);
});

test("generateAgentsToml: ソース md が 1 件以上なら staleCleanupSkipped は false で古い生成物を従来どおり削除する", () => {
  const { root, agentsDir, out, outAgents } = setup();
  writeFileSync(
    join(outAgents, "old-agent.toml"),
    `${GENERATED_MARKER}\nname = "old"\n`,
  );

  const result = generateAgentsToml(out, agentsDir, root);

  expect(result.staleCleanupSkipped).toBe(false);
  expect(result.removed).toEqual(["old-agent"]);
  expect(existsSync(join(outAgents, "old-agent.toml"))).toBe(false);
});
