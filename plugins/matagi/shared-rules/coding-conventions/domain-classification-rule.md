# domain判定・委譲ルール

## 対象

`coding` / `test-coding` / `coding-review` 3スキルが、対象コード domain（frontend/backend等）判定→対応専門サブエージェントへ委譲する際の共通基準。3スキル = 基準再掲せず、本ルールを唯一の正として参照（[[externalization-rule]]）。

## 判定基準

- React / JSX / TSX・Tailwind 等フロントエンド由来依存あり、または frontend ディレクトリ配下 → **frontend**
- サーバー・API・DB アクセス等バックエンド由来コード → **backend**
- 上記いずれも判定不可、または frontend/backend 以外の言語・domain（本 kit に専用サブエージェント無い領域） → **専用サブエージェントなし**扱い

## 対応する専用サブエージェント

| フェーズ | frontend | backend |
|---------|----------|---------|
| 実装 | `frontend-coder` | `backend-coder` |
| テスト実装 | `frontend-tester` | `backend-tester` |
| コーディング規約レビュー | `frontend-code-reviewer` | `backend-code-reviewer` |
| テスト規約レビュー | `frontend-test-reviewer` | `backend-test-reviewer` |
| UI デザインレビュー | `ui-reviewer` | （backend に UI 観点は無い） |

## 専用サブエージェントが無い domain の扱い（フォールバック）

frontend/backend 以外領域（言語違いなど）= エントリスキル自身の in-context 実装／レビューに落とさず、**汎用サブエージェント**（Claude Code 標準 general-purpose 相当。Agent ツールで `subagent_type` 指定せず起動）へ委譲。

- 実装・テスト実装・レビュー いずれも試行錯誤伴いメイン会話を汚しやすい。専用サブエージェント有無問わず一貫して隔離（[[selection-rule]] の「隔離したい副次タスク」基準）。専用サブエージェントある domain だけ隔離、無い domain は in-context、という domain 依存の可視性差を作らない。
- 汎用サブエージェントへ [[design-rule]] 設計原則と対象言語一般的イディオムに従うよう指示。backend 専用規約と同様、対象言語固有規約が未明文化の前提で委譲。
- レビュー用途で汎用サブエージェントへ委譲する場合 「指摘のみ・修正は適用しない」旨を明示（[[review-independence-rule]]）。

## 関連ルール

- [[design-rule]]（`shared-rules/design-principles/design-rule.md`） — フォールバック時に依拠する設計原則
