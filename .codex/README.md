# .codex

Codex CLI がこのワークスペースを開いたときに読み込むディレクトリです。`skills/*` と `hooks` は `plugins/matagi/` 配下への symlink（source of truth は複製しない）、`config.toml` と `agents/` は `plugins/matagi/adapters/codex/` の変換スクリプトで生成する成果物（git 管理外）です。詳細・生成手順は `plugins/matagi/documents/reference/multi-agent-support/codex-adapter.md` を参照してください。
