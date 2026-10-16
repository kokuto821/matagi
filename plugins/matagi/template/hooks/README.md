# hooks テンプレート

Claude Code のフック機能で実行するスクリプトのひな形置き場。

## フックとは

特定イベント（ツール実行前後・セッション終了など）で自動実行されるシェルスクリプト。
Claude 判断に頼らず**強制的制約**を設けたいとき使う。

## 主なイベント種別

| イベント | タイミング |
|----------|-----------|
| `PreToolUse` | ツール実行前（ブロック・書き換えが可能） |
| `PostToolUse` | ツール実行後（ログ・後処理） |
| `Stop` | Claude の応答完了後 |

## ここに置くもの

- 禁止コマンドをブロックする `.sh`
- 実行ログを記録する `.sh`
- 出力を自動整形・検証する `.sh`

## 参考

設定（配線）書き場所 = 2つ。

- プラグイン配布フック: `plugins/matagi/.claude-plugin/plugin.json` の `hooks` セクション。スクリプト本体 = `plugins/matagi/hooks/` に置き、パス = `${CLAUDE_PLUGIN_ROOT}` 起点記述。
- プロジェクト限定フック: `.claude/settings.json` の `hooks` セクション。

実装例: `../../hooks/protected-branch-guard.ts`（保護ブランチ上の `git commit` / `git push` を `PreToolUse` でブロックする）。