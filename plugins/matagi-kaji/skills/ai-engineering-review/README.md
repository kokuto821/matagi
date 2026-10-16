# ai-engineering-review

Claude Code のステアリング資産（AGENTS.md/CLAUDE.md・rules・skills・subagents・hooks）を**まとめてレビュー**する統合オーケストレータースキル。

「プロンプト品質」（`prompt-reviewer` エージェント）・「ステアリング手法の選択」（`steering-reviewer` エージェント）・「コンテキスト設計」（`context-reviewer` エージェント）の3観点に並行委譲、所見を統合して指摘のみ返す（改善の適用はしない）。単一観点だけなら `prompt-review` / `harness-review` / `context-engineering-review` を直接使う。人間向け概要はここ、AI/ハーネス向け定義は `SKILL.md`。
