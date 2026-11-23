// プロンプト共通化 CLI（detect / apply / expand / check）。I/O は CliIo で注入する。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { join, relative, resolve, sep } from "node:path";
import type { ParseArgsOptionsConfig } from "node:util";
import { parseArgs } from "node:util";
import type { Plan, PlanOccurrence, PlanPhrase } from "./apply.ts";
import { planApply } from "./apply.ts";
import { checkBlocks, checkPhraseFile, formatFinding } from "./check.ts";
import type { DetectOptions, SourceFile } from "./detect.ts";
import { detectCandidates } from "./detect.ts";
import { expandBlocks, findingOfExpandError } from "./expand.ts";
import type { ReadPhrase } from "./markdown-scan.ts";
import { parseImportBlocks } from "./markdown-scan.ts";

const STATUS_OK = 0;
const STATUS_FINDINGS = 1;
const STATUS_ERROR = 2;

const OUTPUT_LINE_BREAK = "\n";
const PATH_SEPARATOR = "/";
const CURRENT_DIRECTORY = ".";
const JSON_INDENT = 2;
const ERROR_PREFIX = "error: ";

const USAGE = [
  "usage: prompt-commons <command> [options]",
  "  detect <path...> [--root <dir>] [--threshold <number>] [--min-chars <number>]",
  "  apply --plan <file> [--root <dir>]",
  "  expand <path...> [--root <dir>]",
  "  check <path...> [--root <dir>]",
].join(OUTPUT_LINE_BREAK);

export type CliIo = {
  cwd: string;
  readFile: (path: string) => string | undefined;
  writeFile: (path: string, content: string) => void;
  listMarkdownFiles: (path: string) => string[] | undefined;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

export type PlanParseResult = { plan: Plan } | { errors: string[] };

// ---- 計画 JSON の検証 ----

type JsonObject = Record<string, unknown>;

const PLAN_NOT_OBJECT_MESSAGE =
  "計画のトップレベルはオブジェクトである必要があります";
const INVALID_JSON_MESSAGE = "計画が JSON として読めません";

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childPath(parent: string, key: string): string {
  return parent === "" ? key : `${parent}.${key}`;
}

function objectAt(
  value: unknown,
  path: string,
  errors: string[],
): JsonObject | undefined {
  if (isJsonObject(value)) {
    return value;
  }
  errors.push(`${path}: オブジェクトである必要があります`);
  return undefined;
}

function stringAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): string | undefined {
  const value = source[key];
  if (typeof value === "string") {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 文字列である必要があります`);
  return undefined;
}

function integerAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): number | undefined {
  const value = source[key];
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 整数である必要があります`);
  return undefined;
}

function arrayAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): unknown[] | undefined {
  const value = source[key];
  if (Array.isArray(value)) {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 配列である必要があります`);
  return undefined;
}

// 要素ごとに検証し、不正な要素は errors に積んで結果から除く。
function parseItems<T>(
  items: unknown[],
  path: string,
  parseItem: (
    item: unknown,
    itemPath: string,
    errors: string[],
  ) => T | undefined,
  errors: string[],
): T[] {
  return items.flatMap((item, index) => {
    const parsed = parseItem(item, `${path}[${index}]`, errors);
    return parsed === undefined ? [] : [parsed];
  });
}

function parseOccurrence(
  item: unknown,
  path: string,
  errors: string[],
): PlanOccurrence | undefined {
  const source = objectAt(item, path, errors);
  if (source === undefined) {
    return undefined;
  }
  const file = stringAt(source, "file", path, errors);
  const startLine = integerAt(source, "startLine", path, errors);
  const endLine = integerAt(source, "endLine", path, errors);
  const expectedText = stringAt(source, "expectedText", path, errors);
  if (
    file === undefined ||
    startLine === undefined ||
    endLine === undefined ||
    expectedText === undefined
  ) {
    return undefined;
  }
  return { file, startLine, endLine, expectedText };
}

function parsePhrase(
  item: unknown,
  path: string,
  errors: string[],
): PlanPhrase | undefined {
  const source = objectAt(item, path, errors);
  if (source === undefined) {
    return undefined;
  }
  const name = stringAt(source, "name", path, errors);
  const text = stringAt(source, "text", path, errors);
  const occurrenceItems = arrayAt(source, "occurrences", path, errors);
  if (
    name === undefined ||
    text === undefined ||
    occurrenceItems === undefined
  ) {
    return undefined;
  }
  const occurrences = parseItems(
    occurrenceItems,
    childPath(path, "occurrences"),
    parseOccurrence,
    errors,
  );
  return { name, text, occurrences };
}

// 計画 JSON を検証して Plan にする。形の違反は該当箇所のパスつきで全て返す。
export function parsePlan(text: string): PlanParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { errors: [INVALID_JSON_MESSAGE] };
  }
  if (!isJsonObject(json)) {
    return { errors: [PLAN_NOT_OBJECT_MESSAGE] };
  }

  const errors: string[] = [];
  const dir = stringAt(json, "dir", "", errors);
  const phraseItems = arrayAt(json, "phrases", "", errors);
  const phrases =
    phraseItems === undefined
      ? []
      : parseItems(phraseItems, "phrases", parsePhrase, errors);
  if (errors.length > 0 || dir === undefined) {
    return { errors };
  }
  return { plan: { dir, phrases } };
}

// ---- コマンドライン解析 ----

class UsageError extends Error {}

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

type Request = {
  command: Command;
  paths: string[];
  root: string | undefined;
  plan: string | undefined;
  detectOptions: DetectOptions;
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isCommand(value: string | undefined): value is Command {
  return COMMANDS.some((command) => command === value);
}

function stringValue(values: JsonObject, name: string): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

function numberValue(
  values: JsonObject,
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

function validateRequest({ command, paths }: Request): void {
  if (command === "apply") {
    if (paths.length > 0) {
      throw new UsageError("apply は path を受け取りません");
    }
    return;
  }
  if (paths.length === 0) {
    throw new UsageError(`${command} には path が必要です`);
  }
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
  const request: Request = {
    command,
    paths: positionals,
    root: stringValue(values, "root"),
    plan: stringValue(values, "plan"),
    detectOptions: {
      threshold: numberValue(values, "threshold", Number.isFinite),
      minChars: numberValue(values, "min-chars", isNonNegativeInteger),
    },
  };
  validateRequest(request);
  return request;
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
  write(lines.join(OUTPUT_LINE_BREAK) + OUTPUT_LINE_BREAK);
}

function absoluteOf(context: Context, rootRelativePath: string): string {
  return join(context.rootDir, rootRelativePath);
}

function rootRelativeOf(context: Context, absolutePath: string): string {
  return relative(context.rootDir, absolutePath)
    .split(sep)
    .join(PATH_SEPARATOR);
}

function readPhraseOf(context: Context): ReadPhrase {
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
    JSON.stringify({ candidates }, null, JSON_INDENT) + OUTPUT_LINE_BREAK,
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
      parseImportBlocks(text).blocks.map(({ path }) => path),
    ),
  );
  // 読めない共通文言ファイルは checkBlocks が報告済みなので、ここでは読めたものだけ検査する。
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

  for (const { file, text, expanded } of results) {
    if (expanded.text !== text) {
      context.io.writeFile(absoluteOf(context, file), expanded.text);
    }
  }
  return STATUS_OK;
}

function runApply(context: Context, planPath: string | undefined): number {
  if (planPath === undefined) {
    throw new UsageError("apply には --plan が必要です");
  }
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

  for (const { path, content } of writes) {
    context.io.writeFile(absoluteOf(context, path), content);
  }
  writeLines(
    context.io.stdout,
    writes.map(({ path }) => path),
  );
  return STATUS_OK;
}

function execute(request: Request, io: CliIo): number {
  const context: Context = {
    io,
    rootDir: resolve(io.cwd, request.root ?? CURRENT_DIRECTORY),
  };
  const { command, paths, plan, detectOptions } = request;
  switch (command) {
    case "detect":
      return withSources(context, paths, (sources) =>
        runDetect(context, sources, detectOptions),
      );
    case "check":
      return withSources(context, paths, (sources) =>
        runCheck(context, sources),
      );
    case "expand":
      return withSources(context, paths, (sources) =>
        runExpand(context, sources),
      );
    case "apply":
      return runApply(context, plan);
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
