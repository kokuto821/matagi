# adapters

`plugins/matagi/` を Claude Code 以外エージェントから使う変換・配線スクリプト置き場。エージェント別サブディレクトリ分離。`plugins/matagi/` 唯一 source of truth 維持（複製なし）。

| ディレクトリ | 対象 |
|-------------|------|
| `antigravity/` | Google Antigravity（issue #59） |
| `codex/` | Codex CLI（issue #58） |
| `opencode/` | OpenCode（issue #60） |

`shared.ts` = 各アダプタ共有、Claude Code 向け `plugin.json` 読込・マニフェスト書出の共通処理。各エージェント固有事実・導入手順 → `../documents/reference/multi-agent-support/` 参照。
