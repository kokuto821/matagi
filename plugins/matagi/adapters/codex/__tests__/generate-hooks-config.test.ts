// Run: vitest run (plugins/matagi/ 配下)

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { makeTempDir } from "../../__tests__/helpers/tempDir.ts";
import {
  assertShellSafePath,
  type ClaudePluginManifest,
  generateHooksConfig,
  hookScriptName,
  toCodexHookEntries,
  toConfigToml,
} from "../generate-hooks-config.ts";

const ROOT = "/opt/plugin-root";

const commandOf = (script: string) =>
  `node --experimental-strip-types "\${CLAUDE_PLUGIN_ROOT}/hooks/${script}"`;

const manifestOf = (
  ...hooks: { event?: string; script: string; timeout?: number }[]
): ClaudePluginManifest => {
  const result: NonNullable<ClaudePluginManifest["hooks"]> = {};
  for (const { event = "PreToolUse", script, timeout } of hooks) {
    result[event] ??= [{ matcher: "Edit|Write", hooks: [] }];
    result[event][0].hooks.push({
      type: "command",
      command: commandOf(script),
      ...(timeout === undefined ? {} : { timeout }),
    });
  }
  return { hooks: result };
};

test("hookScriptName: 引用符内の .ts パスからファイル名を抽出する", () => {
  expect(hookScriptName(commandOf("pr-merge-guard.ts"))).toBe(
    "pr-merge-guard.ts",
  );
});

test("hookScriptName: .ts 参照が無ければ null を返す", () => {
  expect(hookScriptName("echo hello")).toBeNull();
});

test("assertShellSafePath: 安全なパスは例外を投げない", () => {
  expect(() => assertShellSafePath("/home/user/my repo/.codex")).not.toThrow();
});

test.each([
  ["二重引用符", '/tmp/a"b'],
  ["ドル記号", "/tmp/a$b"],
  ["バッククォート", "/tmp/a`b"],
  ["バックスラッシュ", "/tmp/a\\b"],
  ["改行", "/tmp/a\nb"],
  ["NUL", "/tmp/a\u0000b"],
  ["DEL", "/tmp/a\u007Fb"],
])("assertShellSafePath: %s を含むパスを拒否する", (_label, path) => {
  expect(() => assertShellSafePath(path)).toThrow(/安全に扱えない/);
});

test("toCodexHookEntries: protected-branch-guard の matcher は Bash|apply_patch", () => {
  const entries = toCodexHookEntries(
    manifestOf({ script: "protected-branch-guard.ts" }),
    ROOT,
  );

  expect(entries).toHaveLength(1);
  expect(entries[0].matcher).toBe("Bash|apply_patch");
  expect(entries[0].event).toBe("PreToolUse");
});

test("toCodexHookEntries: pr-merge-guard の matcher は Bash", () => {
  const entries = toCodexHookEntries(
    manifestOf(
      { script: "protected-branch-guard.ts" },
      { script: "pr-merge-guard.ts" },
    ),
    ROOT,
  );

  expect(
    entries.find((e) => e.command.includes("pr-merge-guard.ts"))?.matcher,
  ).toBe("Bash");
});

test("toCodexHookEntries: antigravity-manifest-sync は静かに除外する", () => {
  const entries = toCodexHookEntries(
    manifestOf(
      { script: "protected-branch-guard.ts" },
      { script: "antigravity-manifest-sync.ts" },
    ),
    ROOT,
  );

  expect(entries.map((e) => hookScriptName(e.command))).toEqual([
    "protected-branch-guard.ts",
  ]);
});

test("toCodexHookEntries: 未知のフックは Error にする", () => {
  const source = manifestOf(
    { script: "protected-branch-guard.ts" },
    { script: "unknown-hook.ts" },
  );

  expect(() => toCodexHookEntries(source, ROOT)).toThrow(/unknown-hook\.ts/);
});

test("toCodexHookEntries: .ts を参照しないコマンドは未対応として Error にする", () => {
  const source: ClaudePluginManifest = {
    hooks: {
      PreToolUse: [
        { matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] },
      ],
    },
  };

  expect(() => toCodexHookEntries(source, ROOT)).toThrow(/echo hi/);
});

test("toCodexHookEntries: protected-branch-guard が欠落していれば Error にする", () => {
  expect(() =>
    toCodexHookEntries(manifestOf({ script: "pr-merge-guard.ts" }), ROOT),
  ).toThrow(/protected-branch-guard\.ts/);
});

test.each([
  ["hooks キー無し", {}],
  ["hooks が空オブジェクト", { hooks: {} }],
])(
  "toCodexHookEntries: %sなら Error にする",
  (_label, source: ClaudePluginManifest) => {
    expect(() => toCodexHookEntries(source, ROOT)).toThrow(
      /protected-branch-guard\.ts/,
    );
  },
);

test.each(["Pre Tool", "Pre.Tool", 'Pre"Tool', "Pre\nTool", ""])(
  "toCodexHookEntries: 不正な event 名 %j は Error にする",
  (event) => {
    const source = manifestOf({ event, script: "protected-branch-guard.ts" });

    expect(() => toCodexHookEntries(source, ROOT)).toThrow(/event 名/);
  },
);

test("toCodexHookEntries: ${CLAUDE_PLUGIN_ROOT} を絶対パスに置換する", () => {
  const entries = toCodexHookEntries(
    manifestOf({ script: "protected-branch-guard.ts" }),
    ROOT,
  );

  expect(entries[0].command).toBe(
    `node --experimental-strip-types "${ROOT}/hooks/protected-branch-guard.ts"`,
  );
});

test("toCodexHookEntries: timeout があれば引き継ぎ、無ければキー自体を持たない", () => {
  const entries = toCodexHookEntries(
    manifestOf(
      { script: "protected-branch-guard.ts", timeout: 10 },
      { script: "pr-merge-guard.ts" },
    ),
    ROOT,
  );

  expect(entries[0].timeout).toBe(10);
  expect("timeout" in entries[1]).toBe(false);
});

test("toCodexHookEntries: 安全でない pluginRoot は Error にする", () => {
  expect(() =>
    toCodexHookEntries(
      manifestOf({ script: "protected-branch-guard.ts" }),
      '/tmp/a"b',
    ),
  ).toThrow(/安全に扱えない/);
});

test("toConfigToml: timeout 無しのエントリを [[hooks.<event>]] テーブルにする", () => {
  const toml = toConfigToml([
    { event: "PreToolUse", matcher: "Bash", command: 'node "/x/hooks/a.ts"' },
  ]);

  expect(toml).toBe(
    [
      "[[hooks.PreToolUse]]",
      'matcher = "Bash"',
      "",
      "[[hooks.PreToolUse.hooks]]",
      'type = "command"',
      'command = "node \\"/x/hooks/a.ts\\""',
      "",
    ].join("\n"),
  );
});

test("toConfigToml: timeout ありなら timeout 行を出力し、複数エントリは空行で区切る", () => {
  const toml = toConfigToml([
    { event: "PreToolUse", matcher: "Bash", command: "a", timeout: 5 },
    { event: "PostToolUse", matcher: "Bash", command: "b" },
  ]);

  expect(toml).toContain('command = "a"\ntimeout = 5\n\n[[hooks.PostToolUse]]');
  expect(toml.endsWith("\n")).toBe(true);
});

test("generateHooksConfig: config.toml を出力し、出力先の絶対パスを埋め込む", () => {
  const dir = makeTempDir();

  const outputPath = generateHooksConfig(
    dir,
    {},
    manifestOf({ script: "protected-branch-guard.ts" }),
  );

  expect(outputPath).toBe(join(dir, "config.toml"));
  const content = readFileSync(outputPath, "utf-8");
  expect(content).toContain(`${dir}/hooks/protected-branch-guard.ts`);
  expect(content).toContain('matcher = "Bash|apply_patch"');
});

test("generateHooksConfig: 既存 config.toml があり force 無しなら失敗し何も書かない", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "config.toml"), "original\n");

  expect(() =>
    generateHooksConfig(
      dir,
      {},
      manifestOf({ script: "protected-branch-guard.ts" }),
    ),
  ).toThrow(/--force/);

  expect(readFileSync(join(dir, "config.toml"), "utf-8")).toBe("original\n");
});

test("generateHooksConfig: force 有りなら既存 config.toml を上書きする", () => {
  const dir = makeTempDir();
  writeFileSync(join(dir, "config.toml"), "original\n");

  generateHooksConfig(
    dir,
    { force: true },
    manifestOf({ script: "protected-branch-guard.ts" }),
  );

  expect(readFileSync(join(dir, "config.toml"), "utf-8")).toContain(
    "[[hooks.PreToolUse]]",
  );
});

test("generateHooksConfig: 変換に失敗した場合は出力先を作らず何も書かない", () => {
  const dir = join(makeTempDir(), "not-created");

  expect(() =>
    generateHooksConfig(dir, {}, manifestOf({ script: "pr-merge-guard.ts" })),
  ).toThrow();

  expect(existsSync(dir)).toBe(false);
});

test("generateHooksConfig: 未作成の出力先ディレクトリを作成する", () => {
  const dir = join(makeTempDir(), "nested", ".codex");

  generateHooksConfig(
    dir,
    {},
    manifestOf({ script: "protected-branch-guard.ts" }),
  );

  expect(existsSync(join(dir, "config.toml"))).toBe(true);
});

/** 出力先の保護対象として使う、ソース側の擬似プラグインルート。 */
const makeSourceRoot = () => {
  const root = makeTempDir("hooks-config-source-");
  mkdirSync(join(root, "hooks"));
  return root;
};

const GUARD_MANIFEST = manifestOf({ script: "protected-branch-guard.ts" });

test.each([
  ["ソースと同一", (root: string) => root],
  ["ソース配下", (root: string) => join(root, "hooks", ".codex")],
])(
  "generateHooksConfig: 出力先が%sなら Error にし何も書かない",
  (_label, outputOf) => {
    const sourceRoot = makeSourceRoot();
    const output = outputOf(sourceRoot);

    expect(() =>
      generateHooksConfig(output, {}, GUARD_MANIFEST, sourceRoot),
    ).toThrow(/ソース破壊防止/);

    expect(existsSync(join(output, "config.toml"))).toBe(false);
  },
);

test("generateHooksConfig: 出力先がソース配下を指す symlink なら Error にしソースに書かない", () => {
  const sourceRoot = makeSourceRoot();
  const link = join(makeTempDir(), "link");
  symlinkSync(join(sourceRoot, "hooks"), link, "dir");

  expect(() =>
    generateHooksConfig(link, {}, GUARD_MANIFEST, sourceRoot),
  ).toThrow(/ソース破壊防止/);

  expect(existsSync(join(sourceRoot, "hooks", "config.toml"))).toBe(false);
});

test("generateHooksConfig: 壊れた symlink の config.toml は force 無しなら Error にし書き込まない", () => {
  const dir = makeTempDir();
  const missing = join(dir, "missing.toml");
  symlinkSync(missing, join(dir, "config.toml"));

  expect(() => generateHooksConfig(dir, {}, GUARD_MANIFEST)).toThrow(/--force/);

  expect(existsSync(missing)).toBe(false);
  expect(readlinkSync(join(dir, "config.toml"))).toBe(missing);
});

test("generateHooksConfig: 壊れた symlink の config.toml は force 有りなら置換できる", () => {
  const dir = makeTempDir();
  const missing = join(dir, "missing.toml");
  symlinkSync(missing, join(dir, "config.toml"));

  generateHooksConfig(dir, { force: true }, GUARD_MANIFEST);

  expect(existsSync(missing)).toBe(false);
  expect(lstatSync(join(dir, "config.toml")).isSymbolicLink()).toBe(false);
  expect(readFileSync(join(dir, "config.toml"), "utf-8")).toContain(
    "protected-branch-guard.ts",
  );
});

test("generateHooksConfig: --force 時に config.toml がソース内実ファイルへの symlink でもソースは不変で config.toml は実ファイルになる", () => {
  const sourceRoot = makeSourceRoot();
  const sourceFile = join(sourceRoot, "hooks", "precious.toml");
  writeFileSync(sourceFile, "original\n");
  const out = makeTempDir();
  symlinkSync(sourceFile, join(out, "config.toml"));

  generateHooksConfig(out, { force: true }, GUARD_MANIFEST, sourceRoot);

  expect(readFileSync(sourceFile, "utf-8")).toBe("original\n");
  expect(lstatSync(join(out, "config.toml")).isSymbolicLink()).toBe(false);
  expect(readFileSync(join(out, "config.toml"), "utf-8")).toContain(
    "protected-branch-guard.ts",
  );
});
