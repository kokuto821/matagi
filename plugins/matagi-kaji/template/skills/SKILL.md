---
name: skill-name
description: >
  何をするスキルか。ユーザーが自然に言う言葉（トリガー語）を先頭に入れる。
  description + when_to_use の合計は 1,536 文字で切られるので要点を先頭に。
# when_to_use: 追加のトリガー例や発動条件（任意）
# allowed-tools: Read, Grep, Bash(git *)（任意）
# disable-model-invocation: true  # 副作用ありのタスク型を手動起動のみにしたい場合
---

# スキルタイトル

## 概要
（1〜2行。何をするスキルか）

## ルール

<!--
このスキルが従う規約・判断基準・禁止事項は、ここに直接書かず参照する。
- 他スキルにも効く / 不変のガイドライン → rules/<topic>/ に切り出して [[name]] で参照
- このスキル固有だが長い → skills/<name>/reference/ に切り出して参照
- 短いスキル固有の判断 → 手順内にインライン可
判断基準は shared-rules/rule-externalization/externalization-rule.md に従う。
ルールが無いスキルなら、この節ごと削除してよい。
-->

- 〇〇は [[xxx-rule]] (`rules/<topic>/xxx-rule.md`) に従う。
- △△は [[yyy-rule]] (`rules/<topic>/yyy-rule.md`) に従う。

## 手順

```mermaid
flowchart TD
    START(["START"])
    END(["END"])

    subgraph L1["1 入力を確認する"]
        S1a["入力を確認する"]
        S1b{"入力が足りているか？"}
        S1c["ユーザーに確認する"]
        S1a --> S1b
        S1b -->|NO| S1c
        S1c --> S1b
    end

    subgraph L2["2 ○○を実行する"]
        S2a["○○スキルへ委譲する"]
    end

    START --> S1a
    S1b -->|YES| S2a
    S2a --> END

    classDef user fill:#fff3bf,stroke:#f08c00,color:#000
    classDef delegate fill:#d0ebff,stroke:#1971c2,color:#000
    class S1c user
    class S2a delegate
```

遷移は図に従い、判定基準・詳細は下の本文に従う。

凡例: 黄 = ユーザーの確認・承認、青 = 他スキル・エージェントへの委譲

<!-- 手順の記述形式は [[template-rule]]（matagi-kaji/shared-rules/template/template-rule.md）§手順の記述形式 に従う -->

1. ...
2. ...

## 出力
（Claude がユーザーに返す内容の形式）
