# harness-review

プロジェクトの Claude Code ステアリング構成（AGENTS.md/CLAUDE.md・rules・skills・subagents・hooks・output styles）を各手法の公式の意図に照らしレビューするスキル。

手法の誤用・逸脱を Critical / Warning / Suggestion で指摘（改善適用なし）。監査→`steering-reviewer` エージェントへ委譲する入口スキル。判断基準=`shared-rules/harness-engineering/selection-rule.md`・`shared-rules/harness-engineering/harness-rule.md`、事実=`documents/reference/harness-engineering/steering-claude-code.md`。プロンプト品質・コンテキスト設計含む横断→`ai-engineering-review`。人間向け概要=ここ、AI/ハーネス向け定義=`SKILL.md`。
