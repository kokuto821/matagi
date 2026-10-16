# matagi-kaji

`matagi` 自体（スキル・サブエージェント・ルール等ステアリング資産）設計・レビュー担うハーネス作成系プラグイン。

matagi 本体開発のみ使うスキル群（プロンプト・コンテキスト設計・ステアリング構成のレビュー・改善適用）集約。issue駆動開発・TDD・実装コードのコーディング/レビュー等 日常的駆動開発系スキルは `matagi` 側。

## ディレクトリ

- `skills/` … Claude Code スキル（`SKILL.md`）
- `agents/` … サブエージェント定義
- `shared-rules/` … 任意タイミング参照の共通ルール
- `documents/reference/` … 参照用資料
- `knowledge/` … 開発で得た経験・知見メモ
- `template/` … スキル・エージェントのテンプレート（`create-skill` 使用）
- `.claude-plugin/` … 本プラグインのマニフェスト

## 依存関係

一部 `shared-rules/` は `matagi` 側ルール（`matagi/shared-rules/matagi-lore/`、`matagi/shared-rules/review-severity/`、`matagi/shared-rules/code-review/` 等）を `[[link]]` 参照。両プラグイン併用 運用前提。
