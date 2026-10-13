# opencode

`plugins/matagi/` を OpenCode（sst/opencode）から使うための変換・配線スクリプトを置く場所です。

- `link-source-dirs.ts`: `skills/` の各スキルと hooks プラグイン（`matagi-hooks.ts`）を、OpenCode の設定ルート（例: `.opencode`）へ symlink する。
- `generate-agents-md.ts`: `agents/*.md` を OpenCode の `agents/<name>.md`（`description` + `mode: subagent`）に変換する。
- `matagi-hooks.ts`: OpenCode プラグイン本体。`tool.execute.before` で既存の `hooks/*.ts`（保護ブランチガード・`gh pr merge` ガード）を呼び、拒否時は例外で実行を止める。
- `hooks-bridge.ts`: OpenCode のツール呼び出し（`bash` / `edit` / `write` / `apply_patch`）を Claude Code 形式のフック入力へ写し、既存フックを子プロセスで起動する。判定ロジックは複製しない。

いずれも `node --experimental-strip-types <script>.ts <出力先ディレクトリ>` で実行します（`generate-agents-md.ts` は内容が異なる既存の `agents/<name>.md` があると何も書かずに失敗し、`--force` で上書きする。先頭コメントのマーカーを持つ古い生成物のみ削除し、ユーザー自作は削除しない。上書き・削除の方針は codex の `generate-agents-toml.ts` と同じ）。導入手順・前提事実・実機検証状況は `plugins/matagi/documents/reference/multi-agent-support/opencode-adapter.md` を参照してください。
