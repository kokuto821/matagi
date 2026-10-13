# adapters

`plugins/matagi/` を Claude Code 以外のエージェントから使うための、変換・配線スクリプトを置く場所です。エージェントごとにサブディレクトリを分け、`plugins/matagi/` を唯一の source of truth のまま維持します（複製しない）。

| ディレクトリ | 対象 |
|-------------|------|
| `antigravity/` | Google Antigravity（issue #59） |
| `codex/` | Codex CLI（issue #58） |
| `opencode/` | OpenCode（issue #60） |

`shared.ts` は各アダプタが共有する、Claude Code 向け `plugin.json` の読み込みとマニフェスト書き出しの共通処理です。各エージェント固有の事実・導入手順は `../documents/reference/multi-agent-support/` を参照してください。
