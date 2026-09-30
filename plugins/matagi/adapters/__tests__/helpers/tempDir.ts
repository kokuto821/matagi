// adapters テスト共通ヘルパー。一時ディレクトリの作成と、各テスト後の自動削除をまとめる。
// このモジュールを import したテストファイルでは、afterEach で作成済みの一時ディレクトリを全て削除する。

import { afterEach } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** 一時ディレクトリを作成し realpath 解決済みのパスを返す（テスト後に自動削除される）。 */
export const makeTempDir = (prefix = "adapters-test-"): string => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  tempDirs.push(dir);
  return dir;
};
