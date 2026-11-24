# Claude Code の `@path` 挙動（スキル・エージェント本文）

issue #106 の設計前に行った実機検証の記録。検証 = Claude Code 2.1.330、`claude -p`（haiku）、ツール無効、各ケース1〜2回の自己申告ベース。確度 = 中。

## 結果

| 検証対象 | 挙動 |
|---------|------|
| SKILL.md 本文の `@rootfile.md`（cwd 相対で解決可能） | 本文には `@rootfile.md` が文字列のまま残る。ファイル内容は本文へ差し込まれず、別添付（Read 結果）として文脈に入る |
| SKILL.md 本文の `@local.md`（スキルディレクトリ相対のみ） | 解決されない。内容は文脈に入らない |
| SKILL.md 本文の `@rootfile.md#fragment` | fragment は剥がされ、ファイル全体が添付される |
| SKILL.md 本文の `<!-- @b.md -->`（HTML コメント内） | 添付される |
| SKILL.md 本文の `` `@c.md` ``（インラインコード） | 添付されない |
| SKILL.md 本文の `<!-- @import prompt-commons.md#x -->`（検証時の記法。現行は 1ファイル1文言でキー・見出し指定なし。[[commonization-rule]] §記法） | 添付されない（`@` 直後が `import`） |
| エージェント定義本文の `@agentfile.md` | 展開も添付もされない。文字列のまま |
| SKILL.md 本文の `${CLAUDE_SKILL_DIR}` | スキルディレクトリの絶対パスへ展開される |
| SKILL.md 本文の `${CLAUDE_PLUGIN_ROOT}` | 展開されない（プロジェクト直下のスキルで検証） |

## 示唆

- 共通文言を「変数」として各プロンプトへ差し込むには、スクリプトでの展開が必須
- 裸の `@path` は共通文言ファイル全体の添付を招く。展開本文と二重に載る
- スクリプト呼び出しのパス = `${CLAUDE_SKILL_DIR}` 起点

## 未検証

- プラグイン経由で配布した場合の `@path` 解決（検証はプロジェクト直下のスキル）
- Claude Code のバージョン差
