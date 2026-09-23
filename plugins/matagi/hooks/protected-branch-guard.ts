#!/usr/bin/env -S node --experimental-strip-types
/**
 * 保護ブランチ上での git commit / push とファイル変更をブロックする PreToolUse フック。
 *
 * 現在のブランチが保護対象（既定: main / master / develop）である場合に、以下を拒否する。
 *
 * - Bash: `git commit` / `git push`（保護ブランチ宛ての push を含む）
 * - Edit / Write / NotebookEdit 等の編集系ツール: git 追跡対象になりうるファイルの変更
 *
 * 判定できないケース（JSON 不正・git リポジトリ外・detached HEAD など）は許可する。
 *
 * 対象外（意図的に見ない）:
 *
 * - git 管理外のパス（スクラッチパッド等）、`.gitignore` 済みのパス、`.git` 配下
 * - **Bash 経由のファイル書き込み**（`sed -i` / リダイレクト / `tee` 等）。シェルの網羅は
 *   原理的に不完全なため追わない。変更が保護ブランチへ着地することは commit / push の
 *   拒否で防ぐ。
 *
 * 保護ブランチは環境変数 CLAUDE_PROTECTED_BRANCHES（スペース区切り）で上書きできる。
 */

import { spawnSync } from "node:child_process";
import { dirname, join, sep, isAbsolute } from "node:path";
import { existsSync, statSync, realpathSync } from "node:fs";
import { tokenize, splitSegments, stripPrefix } from "./command-parser.ts";

const DEFAULT_PROTECTED_BRANCHES = ["main", "master", "develop"];
const BLOCKED_SUBCOMMANDS = new Set(["commit", "push"]);

// 編集系ツールの判定。Read 等の読み取り系を巻き込まないよう、名前に含まれる語で判定する
const EDIT_TOOL_MARKERS = ["Edit", "Write"];
// 編集先パスを保持する tool_input のキー（先に見つかったものを使う）
const EDIT_TOOL_PATH_KEYS = ["file_path", "notebook_path"];

const BRANCH_EXAMPLE =
  "  git switch -c <type>/#<番号>_<summary>   # 例: git switch -c feat/#12_issue-driven-workflow";

// 直後の引数を値として取るグローバルオプション
const GIT_GLOBAL_OPTIONS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);

const protectedBranches = (): string[] => {
  const raw = process.env.CLAUDE_PROTECTED_BRANCHES || "";
  return raw.trim() ? raw.split(/\s+/).filter(Boolean) : DEFAULT_PROTECTED_BRANCHES;
};

const allow = (): never => {
  process.exit(0);
};

const deny = (reason: string): never => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }) + "\n",
  );
  process.exit(0);
};

/** git を実行する。呼び出し元の GIT_* は引き継がない（パスから見た実リポジトリを判定するため）。 */
const runGit = (args: string[], cwd: string) => {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("GIT_") && value !== undefined) {
      env[key] = value;
    }
  }
  try {
    return spawnSync("git", ["-C", cwd, ...args], {
      encoding: "utf-8",
      timeout: 3000,
      env,
    });
  } catch {
    return null;
  }
};

/** directory が git ワークツリー内ならブランチ名を返す。管理外・detached HEAD は null。 */
const currentBranch = (directory: string): string | null => {
  const result = runGit(["rev-parse", "--show-toplevel", "--abbrev-ref", "HEAD"], directory);
  if (result === null || result.status !== 0) {
    return null;
  }
  const lines = (result.stdout || "").split("\n");
  if (lines.length < 2) {
    return null;
  }
  const branch = lines[1].trim();
  return branch && branch !== "HEAD" ? branch : null;
};

/** path が .gitignore 済みなら true。判定できなければ false（＝ガード対象のまま）。 */
const isIgnored = (path: string, directory: string): boolean => {
  const result = runGit(["check-ignore", "-q", "--", path], directory);
  return result !== null && result.status === 0;
};

/** path の親をたどり、実在する最初のディレクトリを返す（未作成の階層に対応）。 */
const existingDirectory = (path: string): string | null => {
  let directory = dirname(path) || sep;
  while (!existsSync(directory) || !statSync(directory).isDirectory()) {
    const parent = dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
  return directory;
};

type GitInvocation = { subcommand: string; args: string[]; repoDir: string | null };

// "-Cxxx" のように -C と値が連結された形式（厳密な "-C" 単体は除く）
const isAttachedCOption = (token: string): boolean => token.startsWith("-C") && token !== "-C";

/** git 呼び出しなら { サブコマンド, 残りの引数, -C の値 } を返す。そうでなければ null。 */
const parseGitInvocation = (segment: string[]): GitInvocation | null => {
  const tokens = stripPrefix(segment);
  if (tokens.length === 0) {
    return null;
  }
  const base = tokens[0].split("/").pop();
  if (base !== "git") {
    return null;
  }

  let repoDir: string | null = null;
  let index = 1;
  while (index < tokens.length) {
    const token = tokens[index];

    if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
      if (token === "-C" && index + 1 < tokens.length) {
        repoDir = tokens[index + 1];
      }
      index += 2;
      continue;
    }

    if (isAttachedCOption(token)) {
      repoDir = token.slice(2);
      index += 1;
      continue;
    }

    if (token.startsWith("-")) {
      index += 1;
      continue;
    }

    return { subcommand: token, args: tokens.slice(index + 1), repoDir };
  }
  return null;
};

/** push の引数に保護ブランチ宛ての refspec が含まれていればその名前を返す。 */
const pushedProtectedBranch = (args: string[], protected_: string[]): string | null => {
  for (const arg of args) {
    if (arg.startsWith("-")) {
      continue;
    }
    let ref = arg.split(":").pop()!;
    ref = ref.split("/").pop()!;
    if (protected_.includes(ref)) {
      return ref;
    }
  }
  return null;
};

const protectedFooter = (): string => {
  return `（保護ブランチ: ${protectedBranches().join(", ")} / 環境変数 CLAUDE_PROTECTED_BRANCHES で変更可）`;
};

const branchReason = (branch: string, subcommand: string): string => {
  return (
    `保護ブランチ \`${branch}\` 上での \`git ${subcommand}\` はフックによりブロックされました。\n` +
    "作業ブランチを切ってから実行してください:\n" +
    `${BRANCH_EXAMPLE}\n` +
    `${protectedFooter()}`
  );
};

const pushTargetReason = (target: string): string => {
  return (
    `保護ブランチ \`${target}\` への \`git push\` はフックによりブロックされました。\n` +
    "作業ブランチを push し、Pull Request 経由でマージしてください:\n" +
    "  git push -u origin <current-branch>\n" +
    `${protectedFooter()}`
  );
};

const editReason = (branch: string, path: string): string => {
  return (
    `保護ブランチ \`${branch}\` 上でのファイル変更（\`${path}\`）はフックによりブロックされました。\n` +
    "issue に紐づく作業ブランチへ移動してから編集してください:\n" +
    `${BRANCH_EXAMPLE}\n` +
    `${protectedFooter()}`
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const APPLY_PATCH_TOOL_NAME = "apply_patch";
const APPLY_PATCH_PATH_HEADER_PATTERN = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm;

const isEditTool = (toolName: unknown): boolean => {
  return (
    (typeof toolName === "string" && EDIT_TOOL_MARKERS.some((marker) => toolName.includes(marker))) ||
    toolName === APPLY_PATCH_TOOL_NAME
  );
};

/** apply_patch のパッチ本文から変更対象パスを全て抽出する。 */
const applyPatchTargets = (command: string): string[] => {
  const targets: string[] = [];
  for (const match of command.matchAll(APPLY_PATCH_PATH_HEADER_PATTERN)) {
    targets.push(match[1].trim());
  }
  return targets;
};

const editTarget = (toolInput: Record<string, unknown>): string | null => {
  for (const key of EDIT_TOOL_PATH_KEYS) {
    const value = toolInput[key];
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return null;
};

/** path が保護ブランチ上の追跡対象ファイルなら拒否理由を返す。問題なければ null。 */
const pathDenialReason = (path: string, cwd: string, protected_: string[]): string | null => {
  // シンボリックリンク経由でワークツリー内へ着弾する経路を塞ぐため実体パスで判定する
  const joined = isAbsolute(path) ? path : join(cwd, path);
  const target = realpathNonStrict(joined);

  const directory = existingDirectory(target);
  if (directory === null) {
    return null;
  }

  const branch = currentBranch(directory);
  if (branch === null || !protected_.includes(branch)) {
    return null;
  }
  if (isIgnored(target, directory)) {
    return null;
  }
  return editReason(branch, path);
};

/** 保護ブランチ上の追跡対象ファイルへの変更なら拒否理由を返す。問題なければ null。 */
const editDenialReason = (toolInput: Record<string, unknown>, cwd: string, protected_: string[]): string | null => {
  const path = editTarget(toolInput);
  if (path === null) {
    return null;
  }
  return pathDenialReason(path, cwd, protected_);
};

/** apply_patch の command からパッチ対象パスを抽出し、いずれかが拒否対象なら拒否理由を返す。 */
const applyPatchDenialReason = (
  toolInput: Record<string, unknown>,
  cwd: string,
  protected_: string[],
): string | null => {
  const command = toolInput.command;
  if (typeof command !== "string" || !command) {
    return null;
  }
  for (const path of applyPatchTargets(command)) {
    const reason = pathDenialReason(path, cwd, protected_);
    if (reason) {
      return reason;
    }
  }
  return null;
};

/** os.path.realpath 相当（存在しないパスでもエラーにせず可能な限り解決する）。 */
const realpathNonStrict = (path: string): string => {
  try {
    return realpathSync(path);
  } catch {
    const dir = dirname(path);
    if (dir === path) {
      return path;
    }
    const skip = dir === "/" ? dir.length : dir.length + 1;
    return join(realpathNonStrict(dir), path.slice(skip) || "");
  }
};

/** 保護ブランチ上の git commit / push なら拒否理由を返す。問題なければ null。 */
const bashDenialReason = (command: string, cwd: string, protected_: string[]): string | null => {
  let segments: string[][];
  try {
    segments = splitSegments(tokenize(command));
  } catch {
    return null;
  }

  for (const segment of segments) {
    const invocation = parseGitInvocation(segment);
    if (invocation === null) {
      continue;
    }
    const { subcommand, args, repoDir } = invocation;
    if (!BLOCKED_SUBCOMMANDS.has(subcommand)) {
      continue;
    }

    const repo = repoDir ? join(cwd, repoDir) : cwd;
    const branch = currentBranch(repo);
    if (branch !== null && protected_.includes(branch)) {
      return branchReason(branch, subcommand);
    }

    if (subcommand === "push") {
      const target = pushedProtectedBranch(args, protected_);
      if (target) {
        return pushTargetReason(target);
      }
    }
  }
  return null;
};

/** ツール種別に応じた拒否理由の解決を振り分ける。問題なければ null。 */
const resolveDenialReason = (
  toolName: unknown,
  toolInput: Record<string, unknown>,
  cwd: string,
  protected_: string[],
): string | null => {
  if (toolName === APPLY_PATCH_TOOL_NAME) {
    return applyPatchDenialReason(toolInput, cwd, protected_);
  }
  if (isEditTool(toolName)) {
    return editDenialReason(toolInput, cwd, protected_);
  }
  if (toolName !== "Bash") {
    return null;
  }
  const command = toolInput.command;
  if (typeof command !== "string" || !command) {
    return null;
  }
  return bashDenialReason(command, cwd, protected_);
};

const readStdin = (): Promise<string> => {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
};

const main = async () => {
  const input = await readStdin();

  let payload: unknown;
  try {
    payload = JSON.parse(input);
  } catch {
    allow();
  }

  if (!isRecord(payload)) {
    allow();
  }

  const toolInput = payload.tool_input;
  if (!isRecord(toolInput)) {
    allow();
  }

  const toolName = payload.tool_name;
  const cwd: string = typeof payload.cwd === "string" && payload.cwd ? payload.cwd : process.cwd();
  const protected_ = protectedBranches();

  const reason = resolveDenialReason(toolName, toolInput, cwd, protected_);

  if (reason) {
    deny(reason);
  }
  allow();
};

main();
