// CLI の実 I/O（fs・process）。cli.ts へ注入する CliIo を組み立てる。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import type { Stats } from "node:fs";
import { dirname, join } from "node:path";
import type { CliIo } from "./cli.ts";

const NOT_FOUND_CODE = "ENOENT";
const TEXT_ENCODING = "utf8";
const MARKDOWN_EXTENSION = ".md";
const RELATIVE_PATH_SEPARATOR = "/";
const EXCLUDED_DIRECTORIES = new Set(["node_modules", ".git"]);

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error && "code" in error && error.code === NOT_FOUND_CODE
  );
}

function readFile(path: string): string | undefined {
  try {
    return readFileSync(path, TEXT_ENCODING);
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }
    throw error;
  }
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, TEXT_ENCODING);
}

function statOf(path: string): Stats | undefined {
  try {
    return statSync(path);
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }
    throw error;
  }
}

// directory 配下の md ファイルを directory からの相対パス（/ 区切り）で返す。
function markdownFilesUnder(directory: string, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      return EXCLUDED_DIRECTORIES.has(entry.name)
        ? []
        : markdownFilesUnder(
            join(directory, entry.name),
            `${relativePath}${RELATIVE_PATH_SEPARATOR}`,
          );
    }
    return entry.isFile() && entry.name.endsWith(MARKDOWN_EXTENSION)
      ? [relativePath]
      : [];
  });
}

// ファイルならそのパス、ディレクトリなら配下の md を昇順で返す。存在しなければ undefined。
function listMarkdownFiles(path: string): string[] | undefined {
  const stats = statOf(path);
  if (stats === undefined) {
    return undefined;
  }
  if (!stats.isDirectory()) {
    return [path];
  }
  return markdownFilesUnder(path)
    .sort()
    .map((relativePath) => join(path, relativePath));
}

export function createNodeIo(): CliIo {
  return {
    cwd: process.cwd(),
    readFile,
    writeFile,
    listMarkdownFiles,
    stdout: (text) => {
      process.stdout.write(text);
    },
    stderr: (text) => {
      process.stderr.write(text);
    },
  };
}
