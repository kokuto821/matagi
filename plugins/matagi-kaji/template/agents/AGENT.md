---
name: agent-name
description: いつこのエージェントに委譲すべきか。積極的に使わせたいなら "use proactively" を入れる。
# tools: Read, Grep, Glob, Bash（任意。省略するとメイン会話の全ツールを継承）
# model: inherit（任意。sonnet / opus / haiku / fable / inherit）
---

あなたは〇〇の専門家です。

呼ばれたときの手順:

```mermaid
flowchart TD
    START(["START"])
    END(["END"])

    subgraph L1["1 入力を確認する"]
        S1a["入力を確認する"]
        S1b{"条件を満たすか？"}
        S1c["確認事項を呼び出し元へ返す"]
        S1a --> S1b
        S1b -->|NO| S1c
    end

    subgraph L2["2 ○○を実行する"]
        S2a["○○を実行する"]
    end

    START --> S1a
    S1b -->|YES| S2a
    S1c --> END
    S2a --> END
```

遷移は図に従い、判定基準・詳細は下の本文に従う。

<!-- 手順の記述形式は [[template-rule]]（matagi-kaji/shared-rules/template/template-rule.md）§手順の記述形式 に従う -->

1. ...
2. ...

チェックリスト / 観点:
- ...

出力フォーマット:
- 優先度（Critical / Warning / Suggestion）ごとに整理して返す。3段階の定義は再掲せず [[severity-rule]]（`matagi/shared-rules/review-severity/severity-rule.md`）に従い、そのドメインの Critical 該当例のみ添える
