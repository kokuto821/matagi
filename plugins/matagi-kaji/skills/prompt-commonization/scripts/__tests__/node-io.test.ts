// Run: vitest run (plugins/matagi-kaji/ 配下)
//
// node-io.ts の writeFile（一時ファイル + rename による原子的な書き込み）のテスト。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createNodeIo } from "../node-io.ts";

const TMP_PREFIX = "prompt-commons-io-";
const TEXT_ENCODING = "utf8";

describe("createNodeIo().writeFile", () => {
  let workDir = "";

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test("親ディレクトリを作って内容を書き込み、同じディレクトリに一時ファイルを残さない", () => {
    // Arrange
    const target = join(workDir, "nested", "phrase.md");

    // Act
    createNodeIo().writeFile(target, "本文\n");

    // Assert
    expect(readFileSync(target, TEXT_ENCODING)).toBe("本文\n");
    expect(readdirSync(join(workDir, "nested"))).toEqual(["phrase.md"]);
  });

  test("既存ファイルを新しい内容へ置き換え、一時ファイルを残さない", () => {
    // Arrange
    const target = join(workDir, "a.md");
    writeFileSync(target, "古い内容\n", TEXT_ENCODING);

    // Act
    createNodeIo().writeFile(target, "新しい内容\n");

    // Assert
    expect(readFileSync(target, TEXT_ENCODING)).toBe("新しい内容\n");
    expect(readdirSync(workDir)).toEqual(["a.md"]);
  });

  test("置き換えに失敗したら例外を投げ、一時ファイルを残さない", () => {
    // Arrange
    const target = join(workDir, "occupied");
    mkdirSync(join(target, "child"), { recursive: true });

    // Act
    const act = () => createNodeIo().writeFile(target, "内容\n");

    // Assert
    expect(act).toThrow();
    expect(readdirSync(workDir)).toEqual(["occupied"]);
  });
});
