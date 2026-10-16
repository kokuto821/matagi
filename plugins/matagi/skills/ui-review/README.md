# ui-review

既存 UI 実装を `shared-rules/ui-design/` ルールに照らしレビュー、違反・逸脱を指摘するスキルの**入口・承認ゲート**。

定義 = `SKILL.md`、ルール本体 = `shared-rules/ui-design/README.md`（索引）参照。監査 = `ui-reviewer` エージェントへ委譲。改善適用まで行う場合 = 人の承認取得後 `ui-designer` エージェント（修正適用専用）に委ねる。レビュワーと産出者は別エージェント（`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。
