# coding

対象コードを分析して frontend / backend を判定。対応する専門サブエージェント（`frontend-coder` / `backend-coder`）へ新規実装を委譲する統合スキル。

定義は `SKILL.md`、domain 判定基準・委譲方針は `shared-rules/coding-conventions/domain-classification-rule.md` を参照。frontend/backend 以外の domain で専用サブエージェントが無い場合も、汎用サブエージェントへ委譲（in-context では実装しない）。

規約準拠レビューは本スキルの担当外。別スキル `coding-review` を使う（実装者に自作物をレビューさせない。`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。
