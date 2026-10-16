# harness-engineering

Claude Code の**ハーネス側設計**（どの手法で表現、どの媒体で強制か）ルール置き場。
プロンプト本文品質を扱う `prompt-engineering/` と対。本領域 =「入れ物・仕組み」の設計判断担当。

- `selection-rule.md`: 「AGENTS.md/CLAUDE.md / rules / skills / subagents / hooks 等どの手法で表現するか」選択。
- `harness-rule.md`: 「破られたら困る制御 → コード強制か md でよいか」媒体判定。
- `review-independence-rule.md`: 「レビュワー・産出者（実装／修正適用）は常に別エージェント」役割分離。

`selection-rule` / `harness-rule` は harness-review スキル / steering-reviewer エージェントの土台。
