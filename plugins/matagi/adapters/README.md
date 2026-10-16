# adapters

`plugins/matagi/` を Claude Code 以外のエージェントから使うための変換・配線スクリプト置き場。エージェントごとにサブディレクトリを分離。`plugins/matagi/` を唯一の source of truth のまま維持（複製しない）。

| ディレクトリ | 対象 |
|-------------|------|
| `antigravity/` | Google Antigravity（issue #59） |
| `codex/` | Codex CLI（issue #58） |
| `opencode/` | OpenCode（issue #60） |

`shared.ts` は各アダプタ共有の、Claude Code 向け `plugin.json` 読み込みとマニフェスト書き出しの共通処理。各エージェント固有の事実・導入手順は `../documents/reference/multi-agent-support/` 参照。
