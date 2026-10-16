# coding-review

対象コード変更を分析→frontend / backend 判定。コーディング規約・テスト規約（frontend のみ UI デザイン追加）観点で専門サブエージェントへ横断レビュー委譲する統合オーケストレーター（指摘のみ）。

定義 = `SKILL.md`、domain 判定基準・委譲方針 = `shared-rules/coding-conventions/domain-classification-rule.md` 参照。各観点 = `frontend-code-reviewer` / `backend-code-reviewer` / `frontend-test-reviewer` / `backend-test-reviewer` / `ui-reviewer`（いずれもレビュー専用）へ委譲。専用サブエージェント無い domain も汎用サブエージェントへ委譲（in-context ではレビューしない）。

改善適用まで行う場合 = 産出者使用: コード・テスト実装 = `coding` / `test-coding` スキル、UI = `ui-review`（承認後 `ui-designer` エージェント）。
