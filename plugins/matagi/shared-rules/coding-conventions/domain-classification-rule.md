# domain判定・委譲ルール

## 対象

`coding` / `test-coding` / `coding-review` の3スキルが、対象コードの domain（frontend/backend等）を
判定し、対応する専門サブエージェントへ委譲する際の共通基準。3スキルは基準を再掲せず、本ルールを
唯一の正として参照（[[externalization-rule]]）。

## 判定基準

- React / JSX / TSX・Tailwind 等フロントエンド由来の依存あり、または frontend ディレクトリ配下 → **frontend**
- サーバー・API・DB アクセス等バックエンド由来のコード → **backend**
- 上記いずれにも判定できない、または frontend/backend 以外の言語・domain（本 kit に専用サブエージェントが無い領域） → **専用サブエージェントなし**として扱う

## 対応する専用サブエージェント

| フェーズ | frontend | backend |
|---------|----------|---------|
| 実装 | `frontend-coder` | `backend-coder` |
| テスト実装 | `frontend-tester` | `backend-tester` |
| コーディング規約レビュー | `frontend-code-reviewer` | `backend-code-reviewer` |
| テスト規約レビュー | `frontend-test-reviewer` | `backend-test-reviewer` |
| UI デザインレビュー | `ui-reviewer` | （backend に UI 観点は無い） |

## 専用サブエージェントが無い domain の扱い（フォールバック）

frontend/backend 以外の領域（言語の違いなど）は、エントリスキル自身の in-context 実装／レビューに
落とさず、**汎用サブエージェント**（Claude Code 標準の general-purpose 相当。Agent ツールで
`subagent_type` を指定せず起動）へ委譲。

- 実装・テスト実装・レビューはいずれも試行錯誤を伴いメイン会話を汚しやすい。専用サブエージェントの
  有無にかかわらず一貫して隔離（[[selection-rule]] の「隔離したい副次タスク」基準）。専用サブエージェントが
  ある domain だけ隔離し、無い domain は in-context にする、という domain 依存の可視性の差を作らない。
- 汎用サブエージェントには [[design-rule]] の設計原則と対象言語の一般的なイディオムに従うよう指示。
  backend 専用規約と同様、対象言語固有の規約が未明文化の前提で委譲。
- レビュー用途で汎用サブエージェントへ委譲する場合は「指摘のみ・修正は適用しない」旨を明示
  （[[review-independence-rule]]）。

## 関連ルール

- [[design-rule]]（`shared-rules/design-principles/design-rule.md`） — フォールバック時に依拠する設計原則
