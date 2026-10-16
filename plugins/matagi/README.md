# matagi

issue駆動開発・TDD・コーディング等、駆動開発系コンテンツの source of truth となるプラグイン本体。ハーネス作成系（プロンプト・コンテキスト設計・ステアリング構成のレビュー）は `matagi-kaji` プラグインが担当。

## ディレクトリ

- `skills/` … Claude Code のスキル（`SKILL.md`）
- `shared-rules/` … Claude が従うルール（参照層。`[[link]]` で必要時に参照）
- `documents/` … 人間がインプットする仕様・調査ドキュメント
- `knowledge/` … 開発で得た経験・知見メモ（AI が記録）
- `agents/` … サブエージェント定義
- `template/` … スキル・エージェント等のテンプレート
- `.claude-plugin/` … 本プラグインのマニフェスト
