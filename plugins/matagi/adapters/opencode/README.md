# opencode

`plugins/matagi/` を OpenCode（sst/opencode）から使う変換・配線スクリプト置き場。

- `link-source-dirs.ts`: `skills/` 各スキルと hooks プラグイン（`matagi-hooks.ts`）→ OpenCode 設定ルート（例: `.opencode`）へ symlink。
- `generate-agents-md.ts`: `agents/*.md` → OpenCode の `agents/<name>.md`（`description` + `mode: subagent`）変換。
- `matagi-hooks.ts`: OpenCode プラグイン本体。`tool.execute.before` で既存 `hooks/*.ts`（保護ブランチガード・`gh pr merge` ガード）呼出、拒否時 例外で実行停止。
- `hooks-bridge.ts`: OpenCode ツール呼出（`bash` / `edit` / `write` / `apply_patch`）→ Claude Code 形式フック入力へ写像、既存フックを子プロセス起動。判定ロジック複製なし。

いずれも `node --experimental-strip-types <script>.ts <出力先ディレクトリ>` 実行（`generate-agents-md.ts` = 内容異なる既存 `agents/<name>.md` あれば何も書かず失敗、`--force` で上書き。先頭コメントのマーカー持つ古い生成物のみ削除、ユーザー自作削除なし。上書き・削除方針 = codex の `generate-agents-toml.ts` と同じ）。導入手順・前提事実・実機検証状況 → `plugins/matagi/documents/reference/multi-agent-support/opencode-adapter.md` 参照。
