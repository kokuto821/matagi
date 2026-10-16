# ui-review

既存 UI 実装を `shared-rules/ui-design/` のルールに照らしてレビューし、違反・逸脱を指摘するスキルの**入口・承認ゲート**。

定義は `SKILL.md`、ルール本体は `shared-rules/ui-design/README.md`（索引）を参照。監査は `ui-reviewer` エージェントへ委譲。改善適用まで行う場合は人の承認を得て `ui-designer` エージェント（修正適用専用）に委ねる。レビュワーと産出者は別エージェント（`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。
