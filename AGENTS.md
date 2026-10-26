# matagi

Claude Code スキル・ナレッジの共有リポジトリ。日本の伝統的猟師集団「マタギ」をモチーフとした、モデル非依存で決定論的な開発ハーネス。

`matagi`（issue駆動開発・TDD・コーディング等の駆動開発系）と `matagi-kaji`（プロンプト・コンテキスト設計・ステアリング構成のレビューを担うハーネス作成系）の2プラグイン構成。

## マタギの掟

1. **無計画入山禁止** — 対象 issue 定めず作業に入らない。方針合意なき実装着手を禁ずる。
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
| コード設計の普遍原則（DRY 等） | `plugins/matagi/shared-rules/design-principles/design-rule.md` |
| ユーザーフィードバックのルール化 | `plugins/matagi/shared-rules/user-feedback/feedback-rule.md` |
| issue 駆動開発（フェーズ分離・issue 化の判断・issue 紐づきブランチ必須） | `plugins/matagi/shared-rules/issue-driven-development/issue-driven-rule.md` |
| コードレビュー共通ルール（目的＝コードの健康状態の改善・承認の閾値・観点） | `plugins/matagi/shared-rules/code-review/review-rule.md` |
| レビュー重大度（Critical/Warning/Suggestion）の共通定義 | `plugins/matagi/shared-rules/review-severity/severity-rule.md` |
| README の配置（全ディレクトリに必須） | `plugins/matagi/shared-rules/readme-convention/readme-rule.md` |
| OpenSpec と既存 skill の役割分担（大規模変更の合意形成） | `plugins/matagi/shared-rules/openspec-integration/openspec-rule.md` |
| UIデザイン（索引から各ルールへ） | `plugins/matagi/shared-rules/ui-design/README.md` |
| マタギ用語集・役職規約（シカリ/セコ/ブッパ/オキテ、山詞） | `plugins/matagi/shared-rules/matagi-lore/glossary-rule.md` |

#### matagi-kaji（ハーネス作成系）

| トピック | ルールファイル |
|----------|--------------|
| ファイル配置・リポジトリ構造 | `plugins/matagi-kaji/shared-rules/repository-structure/structure-rule.md` |
| 原典の忠実な取り扱い | `plugins/matagi-kaji/shared-rules/content-fidelity/content-fidelity-rule.md` |
| shared-rules ディレクトリ規約（配置・命名・相互リンク記法 `[[slug]]`） | `plugins/matagi-kaji/shared-rules/rules-directory/directory-rule.md` |
| 命名規則（スキル・エージェント） | `plugins/matagi-kaji/shared-rules/naming-conventions/naming-rule.md` |
| ドキュメント文体（genshijin 通常レベルを既定・変換対象外） | `plugins/matagi-kaji/shared-rules/document-writing/writing-rule.md` |
| スキル作成・評価の役割分担と評価ケース規約 | `plugins/matagi-kaji/shared-rules/skill-roles/skill-roles-rule.md` |
| スキル・エージェントのテンプレート規約（本文構成・手順は mermaid flowchart TD で記述） | `plugins/matagi-kaji/shared-rules/template/template-rule.md` |
| ハーネス制御（コード vs Markdown の一次判定） | `plugins/matagi-kaji/shared-rules/harness-engineering/harness-rule.md` |
| ステアリング手法の選択（AGENTS.md/CLAUDE.md/rules/skills/subagents等） | `plugins/matagi-kaji/shared-rules/harness-engineering/selection-rule.md` |
| レビュー独立性（レビュワーと産出者は常に別エージェント） | `plugins/matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md` |
| スキル・エージェント内のルール外部化 | `plugins/matagi-kaji/shared-rules/rule-externalization/externalization-rule.md` |
| プロンプト構成要素のチェックリスト | `plugins/matagi-kaji/shared-rules/prompt-engineering/composition-rule.md` |
| 推論の足場（分解・自己検証）の要否 | `plugins/matagi-kaji/shared-rules/prompt-engineering/scaffolding-rule.md` |
| プロンプト・スキル改善の原則 | `plugins/matagi-kaji/shared-rules/prompt-engineering/improvement-rule.md` |
| プロンプト頑健性・安全性 | `plugins/matagi-kaji/shared-rules/prompt-engineering/robustness-rule.md` |
| コンテキスト管理（有限な注意予算のキュレーション・長時間軸タスク、索引から各ルールへ） | `plugins/matagi-kaji/shared-rules/context-engineering/README.md` |
