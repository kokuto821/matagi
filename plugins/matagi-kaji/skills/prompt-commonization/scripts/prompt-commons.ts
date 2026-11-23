// プロンプト共通化スクリプト（lib の barrel + 直接実行時の CLI 入口）。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runCli } from "./cli.ts";
import { createNodeIo } from "./node-io.ts";

export * from "./apply.ts";
export * from "./check.ts";
export * from "./cli.ts";
export * from "./detect.ts";
export * from "./expand.ts";
export type {
  ImportBlock,
  ParseError,
  ParseResult,
  ReadPhrase,
} from "./markdown-scan.ts";
export { parseImportBlocks } from "./markdown-scan.ts";

const CLI_ARGV_START_INDEX = 2;

// node で直接実行されたか（シンボリックリンク経由の起動も同一視する）。
function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) {
    return false;
  }
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  process.exitCode = runCli(
    process.argv.slice(CLI_ARGV_START_INDEX),
    createNodeIo(),
  );
}
