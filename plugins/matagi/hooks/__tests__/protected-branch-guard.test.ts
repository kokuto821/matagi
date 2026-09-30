// Run: vitest run (plugins/matagi/ 配下)
//
// protected-branch-guard.ts の起動契約テスト。
// Python 実装（protected-branch-guard.py）の挙動を正として、TypeScript 版が
// 同じ起動契約（stdin JSON -> stdout JSON / exit code）を満たすことを検証する。

import { test, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  runHook as runHookBase,
  parseDenyOutput,
  withTempRepo,
  withTempDir,
  checkoutNewBranch,
  buildApplyPatch,
  type Payload,
} from "./helpers/hookTestHelpers.ts";
import {
  GUARD_SCRIPT_PATH as SCRIPT_PATH,
  commitFile,
  expectAllow,
  expectDenyMatching,
  ignoreFile,
  runApplyPatch,
} from "./helpers/protectedBranchGuardHelpers.ts";

const runHook = (
  payload: Payload,
  envOverrides?: Record<string, string | undefined>,
) => {
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
  withTempDir("no-git-", (dir) => {
    // Arrange (dirはgit未初期化のまま)

    // Act
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m 'x'" },
      cwd: dir,
    });

    // Assert
    expectAllow(result);
  });
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

test("保護ブランチ上でapply_patchツールによるファイル変更を拒否する", () => {
  withTempRepo((repo) => {
    // Arrange (README.mdはリポジトリ初期化時からの追跡対象ファイル)

    // Act
    const result = runHook({
      tool_name: "apply_patch",
      tool_input: {
        command: "*** Begin Patch\n*** Update File: README.md\n*** End Patch",
      },
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

test("保護ブランチ上でapply_patchのAdd Fileを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const patch = buildApplyPatch("*** Add File: new-file.txt", "+hello");

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /new-file\.txt/);
  });
});

test("保護ブランチ上でapply_patchのDelete Fileを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const patch = buildApplyPatch("*** Delete File: README.md");

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /README\.md/);
  });
});

test("apply_patchが複数ファイルで2件目が拒否対象なら拒否する", () => {
  withTempRepo((repo) => {
    // Arrange (1件目は.gitignore対象で許可、2件目は追跡対象)
    ignoreFile(repo, "ignored.txt");
    const patch = buildApplyPatch(
      "*** Update File: ignored.txt",
      "@@",
      "-a",
      "+b",
      "*** Update File: README.md",
    );

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /README\.md/);
  });
});

test("apply_patchのMove to宛先が追跡対象なら拒否する", () => {
  withTempRepo((repo) => {
    // Arrange (移動元は.gitignore対象、宛先はREADME.md)
    ignoreFile(repo, "ignored.txt");
    const patch = buildApplyPatch(
      "*** Update File: ignored.txt",
      "*** Move to: README.md",
      "@@",
      "-a",
      "+b",
    );

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /README\.md/);
  });
});

test("apply_patchの対象が全て.gitignoreされたファイルなら保護ブランチでも許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    ignoreFile(repo, "ignored.txt");
    const patch = buildApplyPatch(
      "*** Update File: ignored.txt",
      "*** Move to: ignored.txt",
    );

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectAllow(result);
  });
});

test("保護されていないブランチのapply_patchは許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    checkoutNewBranch(repo, "feat/#3_work");
    const patch = buildApplyPatch("*** Update File: README.md");

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectAllow(result);
  });
});

test.each([
  ["空文字", ""],
  ["非文字列(数値)", 123],
  ["非文字列(配列)", ["*** Update File: README.md"]],
  ["null", null],
])("apply_patchのcommandが%sなら許可する(fail-open)", (_label, command) => {
  withTempRepo((repo) => {
    // Arrange (保護ブランチ main 上)

    // Act
    const result = runApplyPatch(repo, command);

    // Assert
    expectAllow(result);
  });
});

test("apply_patchのtool_inputにcommandキーが無ければ許可する(fail-open)", () => {
  withTempRepo((repo) => {
    // Arrange
    const payload: Payload = {
      tool_name: "apply_patch",
      tool_input: {},
      cwd: repo,
    };

    // Act
    const result = runHook(payload);

    // Assert
    expectAllow(result);
  });
});

test("ヘッダ0件かつcommand非空のapply_patchは保護ブランチ上で拒否する", () => {
  withTempRepo((repo) => {
    // Arrange (対象を判定できないパッチ)
    const patch = "*** Begin Patch\nnot a header\n*** End Patch";

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /判定できない apply_patch/);
  });
});

test("ヘッダ0件かつcommand非空のapply_patchでも非保護ブランチでは許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    checkoutNewBranch(repo, "feat/#4_work");

    // Act
    const result = runApplyPatch(repo, "not a header");

    // Assert
    expectAllow(result);
  });
});

test("ヘッダ0件のapply_patchはgit管理外なら許可する", () => {
  withTempDir("no-git-", (dir) => {
    // Arrange (dirはgit未初期化)

    // Act
    const result = runApplyPatch(dir, "not a header");

    // Assert
    expectAllow(result);
  });
});

test("apply_patchのサブディレクトリ相対パスを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    commitFile(repo, "sub/dir/file.txt");
    const patch = buildApplyPatch("*** Update File: sub/dir/file.txt");

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /sub\/dir\/file\.txt/);
  });
});

test("cwdがサブディレクトリでもその相対パスのapply_patchを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    commitFile(repo, "sub/file.txt");
    const patch = buildApplyPatch("*** Update File: file.txt");

    // Act
    const result = runApplyPatch(repo, patch, join(repo, "sub"));

    // Assert
    expectDenyMatching(result, /file\.txt/);
  });
});

test("apply_patchの絶対パスを拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const patch = buildApplyPatch(
      `*** Update File: ${join(repo, "README.md")}`,
    );

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /README\.md/);
  });
});

test("未作成の階層へのAdd Fileでも保護ブランチ上なら拒否する", () => {
  withTempRepo((repo) => {
    // Arrange
    const patch = buildApplyPatch("*** Add File: not/yet/created.txt", "+x");

    // Act
    const result = runApplyPatch(repo, patch);

    // Assert
    expectDenyMatching(result, /created\.txt/);
  });
});

test("git管理外の絶対パスに対するapply_patchは許可する", () => {
  withTempRepo((repo) => {
    // Arrange
    withTempDir("outside-", (outside) => {
      const patch = buildApplyPatch(
        `*** Add File: ${join(outside, "scratch.txt")}`,
      );

      // Act
      const result = runApplyPatch(repo, patch);

      // Assert
      expectAllow(result);
    });
  });
});
