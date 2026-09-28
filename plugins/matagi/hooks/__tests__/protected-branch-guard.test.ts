// Run: vitest run (plugins/matagi/ 配下)
//
// protected-branch-guard.ts の起動契約テスト。
// Python 実装（protected-branch-guard.py）の挙動を正として、TypeScript 版が
// 同じ起動契約（stdin JSON -> stdout JSON / exit code）を満たすことを検証する。

import { test, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runHook as runHookBase, parseDenyOutput, withTempRepo, checkoutNewBranch, type Payload } from "./helpers/hookTestHelpers.ts";

const SCRIPT_PATH = join(
  import.meta.dirname ?? __dirname,
  "..",
  "protected-branch-guard.ts",
);

const runHook = (payload: Payload, envOverrides?: Record<string, string | undefined>) => {
  return runHookBase(SCRIPT_PATH, payload, envOverrides);
};

test("保護ブランチ(main)上でBash経由の`git commit`を拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    writeFileSync(join(repo, "file.txt"), "changed\n");
    spawnSync("git", ["add", "."], { cwd: repo });

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m 'oops'" },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.hookEventName).toBe("PreToolUse");
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toMatch(/main/);
    expect(output.permissionDecisionReason).toMatch(/git commit/);
  });
});

test("保護ブランチ(main)上でBash経由の`git push`を拒否する", () => {
  withTempRepo((repo) => {
    // Arrange (追加の準備なし。リポジトリはmainのまま)

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git push" },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toMatch(/main/);
    expect(output.permissionDecisionReason).toMatch(/git push/);
  });
});

test("保護されていないブランチからでも`git push origin main`を拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    checkoutNewBranch(repo, "feat/#1_something");

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git push origin main" },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toMatch(/main/);
  });
});

test("保護ブランチ上でEdit系ツールによるファイル変更を拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const target = join(repo, "README.md");

    // Act
    const result = runHook({
      tool_name: "Edit",
      tool_input: { file_path: target },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toMatch(/main/);
    expect(output.permissionDecisionReason).toMatch(/README\.md/);
  });
});

test("保護ブランチ上でnotebook_pathを使うWriteツールを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const target = join(repo, "notebook.ipynb");

    // Act
    const result = runHook({
      tool_name: "NotebookEdit",
      tool_input: { notebook_path: target },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.permissionDecision).toBe("deny");
  });
});

test("保護ブランチ上でも.gitignoreされたファイルの編集は許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    writeFileSync(join(repo, ".gitignore"), "ignored.txt\n");
    spawnSync("git", ["add", ".gitignore"], { cwd: repo });
    spawnSync("git", ["commit", "-q", "-m", "add gitignore"], { cwd: repo });
    writeFileSync(join(repo, "ignored.txt"), "scratch\n");

    // Act
    const result = runHook({
      tool_name: "Edit",
      tool_input: { file_path: join(repo, "ignored.txt") },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });
});

test("gitで管理されていないディレクトリ外のコマンドは許可する", () => {
  const dir = mkdtempSync(join(tmpdir(), "no-git-"));
  try {
    // Arrange (dirはgit未初期化のまま)

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m 'x'" },
      cwd: dir,
    });

    // Assert
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("detached HEAD状態は許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    const head = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repo,
      encoding: "utf-8",
    }).stdout.trim();
    spawnSync("git", ["checkout", "-q", head], { cwd: repo });

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m 'x'" },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });
});

test("保護されていないブランチでのgit commit/pushは許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    checkoutNewBranch(repo, "feat/#2_work");

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m 'ok'" },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });
});

test("CLAUDE_PROTECTED_BRANCHESによる上書きを尊重する", () => {
  withTempRepo((repo) => {
    // Arrange
    checkoutNewBranch(repo, "release");

    // Act
    const result = runHook(
      {
        tool_name: "Bash",
        tool_input: { command: "git commit -m 'x'" },
        cwd: repo,
      },
      { CLAUDE_PROTECTED_BRANCHES: "release staging" },
    );

    // Assert
    expect(result.status).toBe(0);
    const output = parseDenyOutput(result.stdout);
    expect(output.permissionDecision).toBe("deny");
    expect(output.permissionDecisionReason).toMatch(/release/);
  });
});

test("不正なJSON入力に対してfail-openする", () => {
  // Arrange (入力自体が不正なJSON文字列)

  // Act
  const result = spawnSync("node", [SCRIPT_PATH], {
    input: "{ this is not json",
    encoding: "utf-8",
  });

  // Assert
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe("");
});

test("対象外のツールに対してfail-openする", () => {
  withTempRepo((repo) => {
    // Arrange (対象外ツールReadを指定)

    // Act
    const result = runHook({
      tool_name: "Read",
      tool_input: { file_path: join(repo, "README.md") },
      cwd: repo,
    });

    // Assert
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });
});
