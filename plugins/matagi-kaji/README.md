# matagi-kaji

`matagi` 自体（スキル・サブエージェント・ルール等のステアリング資産）を設計・レビューするハーネス作成系プラグイン。

matagi 本体の開発でのみ使うスキル群（プロンプト・コンテキスト設計・ステアリング構成のレビューと改善適用）を集約。issue駆動開発・TDD・実装コードのコーディング/レビューなど日常的な駆動開発系スキルは `matagi` プラグイン側。

## ディレクトリ

- `skills/` … Claude Code のスキル（`SKILL.md`）
- `agents/` … サブエージェント定義
- `shared-rules/` … 任意タイミングで参照する共通ルール
- `documents/reference/` … 参照用資料
- `knowledge/` … 開発で得た経験・知見メモ
- `template/` … スキル・エージェントのテンプレート（`create-skill` が使用）
- `.claude-plugin/` … このプラグインのマニフェスト

## 依存関係

一部の `shared-rules/` は `matagi` プラグイン側のルール（`matagi/shared-rules/matagi-lore/`、`matagi/shared-rules/review-severity/`、`matagi/shared-rules/code-review/` 等）を `[[link]]` で参照。両プラグイン併用が運用前提。
