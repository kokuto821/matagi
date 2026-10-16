# coding

対象コード分析→frontend / backend 判定。対応専門サブエージェント（`frontend-coder` / `backend-coder`）へ新規実装委譲する統合スキル。

定義 = `SKILL.md`、domain 判定基準・委譲方針 = `shared-rules/coding-conventions/domain-classification-rule.md` 参照。frontend/backend 以外 domain で専用サブエージェント無い場合も、汎用サブエージェントへ委譲（in-context では実装しない）。

規約準拠レビュー = 本スキル担当外。別スキル `coding-review` 使用（実装者に自作物レビューさせない。`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。
