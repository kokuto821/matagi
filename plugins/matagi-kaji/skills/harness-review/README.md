# harness-review

プロジェクトの Claude Code ステアリング構成（AGENTS.md/CLAUDE.md・rules・skills・subagents・hooks・output styles）を、各手法の公式の意図に照らしてレビューするスキル。

手法の誤用・逸脱を Critical / Warning / Suggestion で指摘（改善の適用はしない）。監査は `steering-reviewer` エージェントへ委譲する入口スキル。判断基準は `shared-rules/harness-engineering/selection-rule.md`・`shared-rules/harness-engineering/harness-rule.md`、事実は `documents/reference/harness-engineering/steering-claude-code.md`。プロンプト品質・コンテキスト設計も含めて横断で見るなら `ai-engineering-review`。人間向け概要はここ、AI/ハーネス向け定義は `SKILL.md`。
