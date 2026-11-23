# matagi

Claude Code スキル・ナレッジの共有リポジトリ。日本の伝統的猟師集団「マタギ」をモチーフとした、モデル非依存で決定論的な開発ハーネス。

`matagi`（issue駆動開発・TDD・コーディング等の駆動開発系）と `matagi-kaji`（プロンプト・コンテキスト設計・ステアリング構成のレビューを担うハーネス作成系）の2プラグイン構成。

## マタギの掟

1. **無計画入山禁止** — 対象 issue 定めず作業に入らない（例外 = `issue-driven-rule.md` の issue なし例外）。方針合意なき実装着手を禁ずる。
2. **掟遵守** — 規約に反した仕事は成果と認めない。逸脱は都度指摘・修正する。
3. **下山の義務** — 成果を持ち帰るのみで終わらせない。レビュー・検証を経ずして完了と認めない。
4. **役割不逸脱** — 各役職は己の持ち場のみ担う（[[review-independence-rule]]）。

役職・用語の定義（シカリ/セコ/ブッパ/オキテ、山詞）は `plugins/matagi/shared-rules/matagi-lore/glossary-rule.md` を参照。

## ディレクトリ構造

ディレクトリ構成と読み込みの仕組みは `ARCHITECTURE.md` を参照。

## ルール

詳細は各ルールファイルを参照。

パスは `plugins/matagi/` または `plugins/matagi-kaji/` を起点とする（テーブル中に明記）。すべて参照層（`shared-rules/`）に置き、AGENTS.md 索引・`[[link]]` で必要時に参照する。

ドキュメントと既存のコードが食い違うときはコードの書き方に従い、見つけた食い違いを最後の返答ですべて挙げること。

### 参照ルール索引

#### matagi（駆動開発系）

| トピック | ルールファイル |
|----------|--------------|
| コード設計の普遍原則 | `plugins/matagi/shared-rules/design-principles/design-rule.md` |
| ユーザーフィードバックのルール化 | `plugins/matagi/shared-rules/user-feedback/feedback-rule.md` |
| issue 駆動開発とブランチ運用 | `plugins/matagi/shared-rules/issue-driven-development/issue-driven-rule.md` |
| コードレビュー共通ルール | `plugins/matagi/shared-rules/code-review/review-rule.md` |
| レビュー重大度の共通定義 | `plugins/matagi/shared-rules/review-severity/severity-rule.md` |
| ディレクトリへの README 配置 | `plugins/matagi/shared-rules/readme-convention/readme-rule.md` |
| OpenSpec と既存 skill の役割分担 | `plugins/matagi/shared-rules/openspec-integration/openspec-rule.md` |
| UIデザイン | `plugins/matagi/shared-rules/ui-design/README.md` |
| マタギ用語集・役職規約 | `plugins/matagi/shared-rules/matagi-lore/glossary-rule.md` |

#### matagi-kaji（ハーネス作成系）

| トピック | ルールファイル |
|----------|--------------|
| ファイル配置・リポジトリ構造 | `plugins/matagi-kaji/shared-rules/repository-structure/structure-rule.md` |
| 原典の忠実な取り扱い | `plugins/matagi-kaji/shared-rules/content-fidelity/content-fidelity-rule.md` |
| shared-rules ディレクトリ規約 | `plugins/matagi-kaji/shared-rules/rules-directory/directory-rule.md` |
| スキル・エージェント命名規則 | `plugins/matagi-kaji/shared-rules/naming-conventions/naming-rule.md` |
| ドキュメント文体 | `plugins/matagi-kaji/shared-rules/document-writing/writing-rule.md` |
| スキル作成・評価の役割分担と評価ケース規約 | `plugins/matagi-kaji/shared-rules/skill-roles/skill-roles-rule.md` |
| スキル・エージェントのテンプレート規約 | `plugins/matagi-kaji/shared-rules/template/template-rule.md` |
| コード強制か Markdown かの判定 | `plugins/matagi-kaji/shared-rules/harness-engineering/harness-rule.md` |
| ステアリング手法の置き場所選択 | `plugins/matagi-kaji/shared-rules/harness-engineering/selection-rule.md` |
| レビュー独立性と指摘の適用前承認 | `plugins/matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md` |
| スキル・エージェント内のルール外部化 | `plugins/matagi-kaji/shared-rules/rule-externalization/externalization-rule.md` |
| プロンプト構成要素のチェックリスト | `plugins/matagi-kaji/shared-rules/prompt-engineering/composition-rule.md` |
| 推論の足場の要否 | `plugins/matagi-kaji/shared-rules/prompt-engineering/scaffolding-rule.md` |
| プロンプト・スキル改善の原則 | `plugins/matagi-kaji/shared-rules/prompt-engineering/improvement-rule.md` |
| プロンプト頑健性・安全性 | `plugins/matagi-kaji/shared-rules/prompt-engineering/robustness-rule.md` |
| コンテキスト管理 | `plugins/matagi-kaji/shared-rules/context-engineering/README.md` |
