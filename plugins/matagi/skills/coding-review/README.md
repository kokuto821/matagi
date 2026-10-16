# coding-review

対象コード変更を分析して frontend / backend を判定。コーディング規約・テスト規約（frontend のみ UI デザイン追加）の観点で専門サブエージェントへ横断レビューを委譲する統合オーケストレーター（指摘のみ）。

定義は `SKILL.md`、domain 判定基準・委譲方針は `shared-rules/coding-conventions/domain-classification-rule.md` を参照。各観点は `frontend-code-reviewer` / `backend-code-reviewer` / `frontend-test-reviewer` / `backend-test-reviewer` / `ui-reviewer`（いずれもレビュー専用）へ委譲。専用サブエージェントが無い domain も汎用サブエージェントへ委譲（in-context ではレビューしない）。

改善適用まで行う場合は産出者を使う: コード・テスト実装は `coding` / `test-coding` スキル、UI は `ui-review`（承認後 `ui-designer` エージェント）。
