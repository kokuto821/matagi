# hooks

このプラグイン提供 Claude Code フックスクリプト置き場。

フック = Claude判断に頼らず、ツール実行強制制御する仕組み。配線は `.claude-plugin/plugin.json` の `hooks` セクション。パスは `${CLAUDE_PLUGIN_ROOT}` 起点。

実行ランタイム: Node v22.6+（`--experimental-strip-types` フラグでTypeScript直接実行、ビルド不要）。フラグなしでの直接実行はNode 23.6+/24系で安定するため、`plugin.json`のフック起動コマンドでは明示的に`node --experimental-strip-types`を指定している。テスト: `cd plugins/matagi && npm test`（vitest）。

| ファイル | 役割 |
|---------|------|
| `protected-branch-guard.ts` | 保護ブランチ上 `git commit` / `git push`（Bash）と、編集系ツール（Edit / Write / NotebookEdit 等）および Codex CLI / OpenCode の `apply_patch` によるファイル変更を `PreToolUse` でブロック、作業ブランチ切るよう促す |
| `pr-merge-guard.ts` | `gh pr merge`（Bash）をブランチ・状態問わず常に `PreToolUse` でブロック、PRマージはユーザーがブラウザ上で行うよう促す |
| `__tests__/` | テスト一式。`helpers/test-helpers.ts` に両テストファイル共通ヘルパー（runHook / Payload型 / 拒否出力パース / 一時gitリポジトリ管理） |

**ブロックしないもの**（意図的範囲外）:

- git管理外パス（スクラッチパッド等）、`.gitignore`済みパス、`.git`配下
- **Bash経由ファイル書き込み**（`sed -i` / リダイレクト / `tee`等）。シェル網羅は原理的に不完全なため追わない。変更が保護ブランチへ着地することはcommit/push拒否で防ぐ
- `gh api repos/.../pulls/<番号>/merge`等、`gh pr merge`経由しないPRマージAPI直叩き

保護ブランチ既定値はスクリプト冒頭`DEFAULT_PROTECTED_BRANCHES`参照。環境変数`CLAUDE_PROTECTED_BRANCHES`（スペース区切り）で変更可。

新規フック作成時のひな形・考え方は`../template/hooks/README.md`参照。
