# ai-engineering-review

Claude Code のステアリング資産（AGENTS.md/CLAUDE.md・rules・skills・subagents・hooks）**まとめてレビュー**統合オーケストレータースキル。

「プロンプト品質」（`prompt-reviewer` エージェント）・「ステアリング手法の選択」（`steering-reviewer` エージェント）・「コンテキスト設計」（`context-reviewer` エージェント）3観点並行委譲→所見統合→指摘のみ返す（改善適用なし）。単一観点のみ→`prompt-review` / `harness-review` / `context-engineering-review` 直接使用。人間向け概要=ここ、AI/ハーネス向け定義=`SKILL.md`。
