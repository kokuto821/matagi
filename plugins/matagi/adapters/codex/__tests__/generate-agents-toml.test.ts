// Run: vitest run (plugins/matagi/ 配下)

import { test, expect } from "vitest";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  frontmatterValue,
  generateAgentsToml,
  parseAgent,
  parseAgents,
  toAgentToml,
} from "../generate-agents-toml.ts";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";

const agentMd = (name: string, description: string, body = "本文\n") =>
  `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;

test("frontmatterValue: 指定キーの値を trim して返す", () => {
  expect(frontmatterValue("name:   foo  \ndescription: bar", "name")).toBe(
    "foo",
  );
});

test("frontmatterValue: キーが無ければ null を返す", () => {
  expect(frontmatterValue("name: foo", "description")).toBeNull();
});

test.each([
  ["空", "name:"],
  ["空白のみ", "name:    "],
  ["ブロックスカラー |", "name: |"],
  ["ブロックスカラー >", "name: >"],
  ["ダブルクォート始まり", 'name: "foo"'],
  ["シングルクォート始まり", "name: 'foo'"],
])(
  "frontmatterValue: 値が%sなら未対応として Error にする",
  (_label, frontmatter) => {
    expect(() => frontmatterValue(frontmatter, "name")).toThrow(/未対応/);
  },
);

test("frontmatterValue: name の直後行の description を name の値として拾わない", () => {
  expect(() => frontmatterValue("name:\ndescription: foo", "name")).toThrow(
    /未対応/,
  );
});

test("frontmatterValue: 値が空の name の次行にある description は description として取れる", () => {
  expect(frontmatterValue("name:\ndescription: foo", "description")).toBe(
    "foo",
  );
});

test("parseAgent: frontmatter が無ければ null を返す", () => {
  expect(parseAgent("# README\nただの文書\n")).toBeNull();
});

test("parseAgent: name / description / 本文を取り出す", () => {
  const agent = parseAgent(
    agentMd("my-agent", "説明です", "\n指示A\n指示B\n\n"),
  );

  expect(agent).toEqual({
    name: "my-agent",
    description: "説明です",
    instructions: "指示A\n指示B\n",
  });
});

test("parseAgent: name が欠落していれば Error にする", () => {
  expect(() => parseAgent("---\ndescription: d\n---\nbody\n", "x.md")).toThrow(
    /x\.md/,
  );
});

test("parseAgent: description が欠落していれば Error にする", () => {
  expect(() => parseAgent("---\nname: a\n---\nbody\n", "x.md")).toThrow(
    /name \/ description/,
  );
});

test("parseAgent: CRLF を正規化して解析する", () => {
  const agent = parseAgent(
    "---\r\nname: crlf-agent\r\ndescription: d\r\n---\r\n行1\r\n行2\r\n",
  );

  expect(agent).toEqual({
    name: "crlf-agent",
    description: "d",
    instructions: "行1\n行2\n",
  });
});

test.each(["Upper", "with_underscore", "a/b", "../evil", "a b"])(
  "parseAgent: 不正な name %j は Error にする",
  (name) => {
    expect(() => parseAgent(agentMd(name, "d"), "x.md")).toThrow(/name は/);
  },
);

test("parseAgents: frontmatter 無しのファイルは除外する", () => {
  const agents = parseAgents([
    { file: "README.md", content: "# readme\n" },
    { file: "a.md", content: agentMd("a", "d") },
  ]);

  expect(agents.map((a) => a.name)).toEqual(["a"]);
});

test("parseAgents: name が重複したら両ファイル名入りの Error にする", () => {
  const sources = [
    { file: "one.md", content: agentMd("dup", "d") },
    { file: "two.md", content: agentMd("dup", "d") },
  ];

  expect(() => parseAgents(sources)).toThrow(/dup.*one\.md.*two\.md/);
});

test("toAgentToml: 本文が developer_instructions の multi-line string に入る", () => {
  const toml = toAgentToml({
    name: "a",
    description: 'd "q"',
    instructions: "行1\n行2\n",
  });

  expect(toml).toBe(
    [
      'name = "a"',
      'description = "d \\"q\\""',
      'developer_instructions = """',
      "行1",
      '行2\n"""',
      "",
    ].join("\n"),
  );
});

test("generateAgentsToml: 対象 md のみ <out>/agents/<name>.toml に出力し件数を返す", () => {
  const source = makeTempDir();
  const out = makeTempDir();
  writeFileSync(join(source, "a.md"), agentMd("agent-a", "A", "指示A\n"));
  writeFileSync(join(source, "b.md"), agentMd("agent-b", "B", "指示B\n"));
  writeFileSync(join(source, "README.md"), "# readme\n");
  writeFileSync(join(source, "note.txt"), "ignored");

  const count = generateAgentsToml(out, source);

  expect(count).toBe(2);
  expect(readdirSync(join(out, "agents")).sort()).toEqual([
    "agent-a.toml",
    "agent-b.toml",
  ]);
  expect(readFileSync(join(out, "agents", "agent-a.toml"), "utf-8")).toContain(
    "指示A",
  );
});

test("generateAgentsToml: 検証エラー時は agents 出力ディレクトリを作らない", () => {
  const source = makeTempDir();
  const out = join(makeTempDir(), "codex");
  writeFileSync(join(source, "ok.md"), agentMd("ok", "d"));
  writeFileSync(join(source, "bad.md"), "---\nname: bad\n---\nbody\n");

  expect(() => generateAgentsToml(out, source)).toThrow(/bad\.md/);

  expect(existsSync(join(out, "agents"))).toBe(false);
});

test("generateAgentsToml: 空のソースディレクトリは 0 件を返す", () => {
  const source = makeTempDir();
  mkdirSync(join(source, "sub"));

  expect(generateAgentsToml(makeTempDir(), source)).toBe(0);
});

test.each([
  ["name が空", "---\nname:\ndescription: d\n---\nbody\n"],
  ["description が空", "---\nname: a\ndescription:\n---\nbody\n"],
  ["description が |", "---\nname: a\ndescription: |\n  text\n---\nbody\n"],
  ["description が >", "---\nname: a\ndescription: >\n  text\n---\nbody\n"],
  [
    "name がダブルクォート始まり",
    '---\nname: "a"\ndescription: d\n---\nbody\n',
  ],
  [
    "description がシングルクォート始まり",
    "---\nname: a\ndescription: 'd'\n---\nbody\n",
  ],
])(
  "parseAgent: %sならファイル名入りの未対応 Error にする",
  (_label, source) => {
    expect(() => parseAgent(source, "x.md")).toThrow(/x\.md.*未対応/);
  },
);

test("parseAgent: name が空で次行が description: foo でも name を欠落扱い（未対応）にし description を流用しない", () => {
  expect(() =>
    parseAgent("---\nname:\ndescription: foo\n---\nbody\n", "x.md"),
  ).toThrow(/x\.md.*未対応/);
});

test.each([
  ["name キー不在", "---\ndescription: d\n---\nbody\n"],
  ["description キー不在", "---\nname: a\n---\nbody\n"],
])("parseAgent: %sなら欠落 Error にする", (_label, source) => {
  expect(() => parseAgent(source, "x.md")).toThrow(/name \/ description/);
});

test("parseAgent: 行頭が `---abc` の行は frontmatter の閉じとみなさない", () => {
  const agent = parseAgent(
    "---\nname: a\ndescription: d\n---abc\n---\n本文\n",
    "x.md",
  );

  expect(agent?.name).toBe("a");
  expect(agent?.instructions).toBe("本文\n");
});

test("parseAgent: 閉じの `---` が末尾（改行なし）でも受理する", () => {
  const agent = parseAgent("---\nname: a\ndescription: d\n---", "x.md");

  expect(agent).toEqual({ name: "a", description: "d", instructions: "\n" });
});

test("実 agents/*.md の全12件が変換できる", () => {
  const agentsDir = join(import.meta.dirname, "../../../agents");
  const sources = readdirSync(agentsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      file,
      content: readFileSync(join(agentsDir, file), "utf-8"),
    }));

  const agents = parseAgents(sources);

  expect(agents).toHaveLength(12);
});

/** 出力先の保護対象として使う擬似プラグインルート（agents/ に有効な md を1件持つ）。 */
const makeSourceRoot = () => {
  const root = makeTempDir("agents-toml-source-");
  mkdirSync(join(root, "agents"));
  writeFileSync(join(root, "agents", "a.md"), agentMd("agent-a", "A"));
  return root;
};

test.each([
  ["ソースと同一", (root: string) => root],
  ["ソース配下", (root: string) => join(root, "agents", ".codex")],
])(
  "generateAgentsToml: 出力先が%sなら Error にし何も書かない",
  (_label, outputOf) => {
    const root = makeSourceRoot();
    const output = outputOf(root);

    expect(() =>
      generateAgentsToml(output, join(root, "agents"), root),
    ).toThrow(/ソース破壊防止/);

    expect(existsSync(join(output, "agents", "agent-a.toml"))).toBe(false);
  },
);

test("generateAgentsToml: 出力先がソース配下を指す symlink なら Error にしソースに書かない", () => {
  const root = makeSourceRoot();
  const link = join(makeTempDir(), "link");
  symlinkSync(join(root, "agents"), link, "dir");

  expect(() => generateAgentsToml(link, join(root, "agents"), root)).toThrow(
    /ソース破壊防止/,
  );

  expect(readdirSync(join(root, "agents"))).toEqual(["a.md"]);
});
