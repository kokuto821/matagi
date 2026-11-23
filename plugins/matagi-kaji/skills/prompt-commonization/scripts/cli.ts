// プロンプト共通化 CLI（detect / apply / expand / check）。I/O は CliIo で注入する。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { join, relative, resolve, sep } from "node:path";
import type { ParseArgsOptionsConfig } from "node:util";
import { parseArgs } from "node:util";
import { planApply } from "./apply.ts";
import { checkBlocks, checkPhraseFile } from "./check.ts";
import type { DetectOptions, SourceFile } from "./detect.ts";
import { detectCandidates } from "./detect.ts";
import { expandBlocks, findingOfExpandError } from "./expand.ts";
import { formatFinding } from "./findings.ts";
import type { ReadFile } from "./markdown-scan.ts";
import {
  isRootRelativePath,
  LINE_FEED,
  PATH_SEPARATOR,
  parseImportBlocks,
} from "./markdown-scan.ts";
import { parsePlan } from "./plan-schema.ts";

export type { PlanParseResult } from "./plan-schema.ts";
export { parsePlan } from "./plan-schema.ts";

const STATUS_OK = 0;
const STATUS_FINDINGS = 1;
const STATUS_ERROR = 2;

const CURRENT_DIRECTORY = ".";
const JSON_INDENT = 2;
const ERROR_PREFIX = "error: ";
const WRITTEN_PREFIX = "written: ";
const MIN_THRESHOLD = 0;
const MAX_THRESHOLD = 1;

const USAGE = [
  "usage: prompt-commons <command> [options]",
  "  detect <path...> [--root <dir>] [--threshold <number>] [--min-chars <number>]",
  "  apply --plan <file> [--root <dir>]",
  "  expand <path...> [--root <dir>]",
  "  check <path...> [--root <dir>]",
].join(LINE_FEED);

export type CliIo = {
  cwd: string;
  readFile: (path: string) => string | undefined;
  writeFile: (path: string, content: string) => void;
  listMarkdownFiles: (path: string) => string[] | undefined;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

// ---- コマンドライン解析 ----

class UsageError extends Error {}

type OptionValues = Record<string, unknown>;

const COMMANDS = ["detect", "apply", "expand", "check"] as const;
type Command = (typeof COMMANDS)[number];

const ROOT_OPTIONS: ParseArgsOptionsConfig = { root: { type: "string" } };
const OPTIONS_OF: Record<Command, ParseArgsOptionsConfig> = {
  detect: {
    ...ROOT_OPTIONS,
    threshold: { type: "string" },
    "min-chars": { type: "string" },
  },
  apply: { ...ROOT_OPTIONS, plan: { type: "string" } },
  expand: ROOT_OPTIONS,
  check: ROOT_OPTIONS,
};

type RawRequest = {
  command: Command;
  paths: string[];
  root: string | undefined;
  plan: string | undefined;
  detectOptions: DetectOptions;
};

type Request =
  | (Omit<RawRequest, "command" | "plan"> & {
      command: Exclude<Command, "apply">;
    })
  | (Omit<RawRequest, "command" | "plan"> & { command: "apply"; plan: string });

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isCommand(value: string | undefined): value is Command {
  return COMMANDS.some((command) => command === value);
}

function stringValue(values: OptionValues, name: string): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

function numberValue(
  values: OptionValues,
  name: string,
  isValid: (value: number) => boolean,
): number | undefined {
  const raw = stringValue(values, name);
  if (raw === undefined) {
    return undefined;
  }
  const value = Number(raw);
  if (raw.trim() === "" || !isValid(value)) {
    throw new UsageError(`--${name} の値が不正です: ${raw}`);
  }
  return value;
}

function isThreshold(value: number): boolean {
  return (
    Number.isFinite(value) && value >= MIN_THRESHOLD && value <= MAX_THRESHOLD
  );
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function parseOptions(command: Command, args: string[]) {
  try {
    return parseArgs({
      args,
      options: OPTIONS_OF[command],
      allowPositionals: true,
    });
  } catch (error) {
    throw new UsageError(messageOf(error));
  }
}

function validateRequest(raw: RawRequest): Request {
  const { command, paths, plan, ...rest } = raw;
  if (command === "apply") {
    if (paths.length > 0) {
      throw new UsageError("apply は path を受け取りません");
    }
    if (plan === undefined) {
      throw new UsageError("apply には --plan が必要です");
    }
    return { ...rest, paths, command, plan };
  }
  if (paths.length === 0) {
    throw new UsageError(`${command} には path が必要です`);
  }
  return { ...rest, paths, command };
}

function parseRequest(argv: readonly string[]): Request {
  const [command, ...args] = argv;
  if (!isCommand(command)) {
    throw new UsageError(
      command === undefined
        ? "サブコマンドを指定してください"
        : `未知のサブコマンドです: ${command}`,
    );
  }

  const { values, positionals } = parseOptions(command, args);
  return validateRequest({
    command,
    paths: positionals,
    root: stringValue(values, "root"),
    plan: stringValue(values, "plan"),
    detectOptions: {
      threshold: numberValue(values, "threshold", isThreshold),
      minChars: numberValue(values, "min-chars", isNonNegativeInteger),
    },
  });
}

// ---- コマンドの実行 ----

type Context = {
  io: CliIo;
  rootDir: string;
};

function errorLine(message: string): string {
  return `${ERROR_PREFIX}${message}`;
}

function writeLines(write: (text: string) => void, lines: string[]): void {
  if (lines.length === 0) {
    return;
  }
  write(lines.join(LINE_FEED) + LINE_FEED);
}

function absoluteOf(context: Context, rootRelativePath: string): string {
  return join(context.rootDir, rootRelativePath);
}

function rootRelativeOf(context: Context, absolutePath: string): string {
  return relative(context.rootDir, absolutePath)
    .split(sep)
    .join(PATH_SEPARATOR);
}

function readPhraseOf(context: Context): ReadFile {
  return (path) => context.io.readFile(absoluteOf(context, path));
}

// 指定 path（ファイル・ディレクトリ）を root 相対のファイル一覧にして読み込む。
function loadSources(
  context: Context,
  paths: string[],
): { sources: SourceFile[]; errors: string[] } {
  const files = new Set<string>();
  const errors: string[] = [];
  for (const path of paths) {
    const listed = context.io.listMarkdownFiles(absoluteOf(context, path));
    if (listed === undefined) {
      errors.push(
        errorLine(`${path}: ファイルまたはディレクトリが見つかりません`),
      );
      continue;
    }
    for (const absolutePath of listed) {
      files.add(rootRelativeOf(context, absolutePath));
    }
  }

  const sources: SourceFile[] = [];
  for (const file of files) {
    const text = context.io.readFile(absoluteOf(context, file));
    if (text === undefined) {
      errors.push(errorLine(`${file}: 読み込めません`));
      continue;
    }
    sources.push({ file, text });
  }
  return { sources, errors };
}

function withSources(
  context: Context,
  paths: string[],
  run: (sources: SourceFile[]) => number,
): number {
  const { sources, errors } = loadSources(context, paths);
  if (errors.length > 0) {
    writeLines(context.io.stderr, errors);
    return STATUS_ERROR;
  }
  return run(sources);
}

function runDetect(
  context: Context,
  sources: SourceFile[],
  options: DetectOptions,
): number {
  const candidates = detectCandidates(sources, options);
  context.io.stdout(
    JSON.stringify({ candidates }, null, JSON_INDENT) + LINE_FEED,
  );
  return STATUS_OK;
}

function uniqueOf(values: string[]): string[] {
  return [...new Set(values)];
}

function runCheck(context: Context, sources: SourceFile[]): number {
  const readPhrase = readPhraseOf(context);
  const sourceLines = sources.flatMap(({ file, text }) =>
    checkBlocks(text, readPhrase).map((finding) =>
      formatFinding(file, finding),
    ),
  );
  const phrasePaths = uniqueOf(
    sources.flatMap(({ text }) =>
      parseImportBlocks(text)
        .blocks.map(({ path }) => path)
        .filter(isRootRelativePath),
    ),
  );
  // ルート外のパスは読まない。読めない共通文言ファイルは checkBlocks が報告済みなので、ここでは読めたものだけ検査する。
  const phraseLines = phrasePaths.flatMap((path) => {
    const content = readPhrase(path);
    return content === undefined
      ? []
      : checkPhraseFile(content).map((finding) => formatFinding(path, finding));
  });

  const lines = [...sourceLines, ...phraseLines];
  writeLines(context.io.stdout, lines);
  return lines.length > 0 ? STATUS_FINDINGS : STATUS_OK;
}

// root 相対パスの順に書き込む。失敗したら以降は書かず、失敗したパスと理由・書き込み済みのパスを stderr に出す。
function writeAll(
  context: Context,
  writes: Array<{ path: string; content: string }>,
): number {
  const written: string[] = [];
  for (const { path, content } of writes) {
    try {
      context.io.writeFile(absoluteOf(context, path), content);
    } catch (error) {
      writeLines(context.io.stderr, [
        errorLine(`書き込みに失敗しました: ${path}: ${messageOf(error)}`),
        ...written.map((writtenPath) => `${WRITTEN_PREFIX}${writtenPath}`),
      ]);
      return STATUS_ERROR;
    }
    written.push(path);
  }
  return STATUS_OK;
}

// 全ファイルを検証してから書き込む。1 件でもエラーがあれば何も書かない。
function runExpand(context: Context, sources: SourceFile[]): number {
  const readPhrase = readPhraseOf(context);
  const results = sources.map(({ file, text }) => ({
    file,
    text,
    expanded: expandBlocks(text, readPhrase),
  }));

  const errorLines = results.flatMap(({ file, expanded }) =>
    expanded.errors.map((error) =>
      formatFinding(file, findingOfExpandError(error)),
    ),
  );
  if (errorLines.length > 0) {
    writeLines(context.io.stderr, errorLines);
    return STATUS_ERROR;
  }

  return writeAll(
    context,
    results
      .filter(({ text, expanded }) => expanded.text !== text)
      .map(({ file, expanded }) => ({ path: file, content: expanded.text })),
  );
}

function runApply(context: Context, planPath: string): number {
  const planText = context.io.readFile(resolve(context.io.cwd, planPath));
  if (planText === undefined) {
    writeLines(context.io.stderr, [
      errorLine(`${planPath}: 計画ファイルが見つかりません`),
    ]);
    return STATUS_ERROR;
  }

  const parsed = parsePlan(planText);
  if ("errors" in parsed) {
    writeLines(
      context.io.stderr,
      parsed.errors.map((error) => errorLine(`${planPath}: ${error}`)),
    );
    return STATUS_ERROR;
  }

  const { writes, errors } = planApply(parsed.plan, readPhraseOf(context));
  if (errors.length > 0) {
    writeLines(
      context.io.stderr,
      errors.map(({ kind, message }) => errorLine(`${kind}: ${message}`)),
    );
    return STATUS_ERROR;
  }

  const status = writeAll(context, writes);
  if (status === STATUS_OK) {
    writeLines(
      context.io.stdout,
      writes.map(({ path }) => path),
    );
  }
  return status;
}

function execute(request: Request, io: CliIo): number {
  const context: Context = {
    io,
    rootDir: resolve(io.cwd, request.root ?? CURRENT_DIRECTORY),
  };
  switch (request.command) {
    case "detect":
      return withSources(context, request.paths, (sources) =>
        runDetect(context, sources, request.detectOptions),
      );
    case "check":
      return withSources(context, request.paths, (sources) =>
        runCheck(context, sources),
      );
    case "expand":
      return withSources(context, request.paths, (sources) =>
        runExpand(context, sources),
      );
    case "apply":
      return runApply(context, request.plan);
  }
}

// argv は先頭のサブコマンド以降。終了コード（0 成功 / 1 検出あり / 2 使用法・I/O・検証エラー）を返す。
export function runCli(argv: readonly string[], io: CliIo): number {
  try {
    return execute(parseRequest(argv), io);
  } catch (error) {
    const lines = [errorLine(messageOf(error))];
    if (error instanceof UsageError) {
      lines.push(USAGE);
    }
    writeLines(io.stderr, lines);
    return STATUS_ERROR;
  }
}
