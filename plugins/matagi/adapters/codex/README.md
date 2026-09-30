# codex

`plugins/matagi/` を Codex CLI から使うための変換・配線スクリプトを置く場所です。

- `link-source-dirs.ts`: `skills/` の各スキルと `hooks/` を、Codex の設定ルート（例: `.codex`）へ symlink する。
- `generate-hooks-config.ts`: `plugin.json` の `hooks` を、Codex 向け `config.toml` の `[[hooks.*]]` に変換する（matcher は Codex のツール名に合わせて個別指定）。
- `generate-agents-toml.ts`: `agents/*.md` を Codex の `agents/<name>.toml` に変換する。
- `toml.ts`: 上記が共有する TOML 文字列のシリアライザ。

いずれも `node --experimental-strip-types <script>.ts <出力先ディレクトリ>` で実行します（`generate-hooks-config.ts` は出力先に `config.toml` が既にあると失敗し、上書きには `--force` が必要。`--force` は `config.toml` 全体の置換で、Codex の他の設定も消える）。導入手順・前提事実・実機検証状況は `plugins/matagi/documents/reference/multi-agent-support/codex-adapter.md` を参照してください。
