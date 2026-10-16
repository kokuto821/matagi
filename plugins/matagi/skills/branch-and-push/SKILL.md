---
name: branch-and-push
description: >
  「新しい変更をした、ブランチを作ってpushして」「変更をコミットしてpushして」
  「新しいブランチ切って」と言われたとき、現在の未コミット変更を確認し、
  commit-message-simpleスキルでコミット単位・メッセージを提案したうえで、
  承認を得てからブランチ作成・コミット・pushまでを一気通貫で行う。
---

# branch-and-push

## 概要
未コミット変更→ブランチ作成→コミット→push 一連進行。コミットメッセージ・分割 = commit-message-simple スキルへ委譲。

## ルール

- コミット単位・メッセージフォーマット = [[commit-message-simple]] (`skills/commit-message-simple/SKILL.md`) 出力従う。本スキル独自メッセージ組み立てない。
- push・ブランチ作成・コミット = 取消に手間、または外部公開される操作。実行前 必ずユーザー承認取得。本スキル 各操作前確認挟む対話型フロー。無断自律実行しない。ユーザー「確認なしで進めて」等明示指示ある場合を除き、無断で進めない。

## 手順

```mermaid
flowchart TD
    START(["START"])
    END(["END"])

    subgraph L1["1 変更点を把握する"]
        S1a["git status と git diff で現在の変更点をすべて把握する"]
    end

    subgraph L2["2 変更の有無を確認する"]
        S2a{"変更があるか？"}
        S2b["変更が無い旨をユーザーに伝える"]
        S2a -->|NO| S2b
    end

    subgraph L3["3 コミット案を作成する"]
        S3a["commit-message-simple にコミット単位とメッセージ案を作成させる"]
    end

    subgraph L4["4 コミット計画の承認を得る"]
        S4a["コミット計画をユーザーに提示する"]
        S4b{"承認されたか？"}
        S4a --> S4b
    end

    subgraph L5["5 ブランチ名を決める"]
        S5a{"ユーザーがブランチ名を指定したか？"}
        S5b["コミットの prefix と内容から kebab-case のブランチ名を提案する"]
        S5c{"ブランチ名が承認されたか？"}
        S5a -->|NO| S5b
        S5b --> S5c
        S5c -->|NO| S5b
    end

    subgraph L6["6 ブランチ作成からプッシュまで実行する"]
        S6a["git checkout でブランチを作成する"]
        S6b["コミット単位ごとに git add と git commit を実行する"]
        S6c["git push を実行する"]
        S6a --> S6b
        S6b --> S6c
    end

    subgraph L7["7 結果を提示する"]
        S7a["push 結果と PR 作成 URL があればそれをユーザーに提示する"]
    end

    START --> S1a
    S1a --> S2a
    S2a -->|YES| S3a
    S2b --> END
    S3a --> S4a
    S4b -->|YES| S5a
    S4b -->|NO| S3a
    S5a -->|YES| S6a
    S5c -->|YES| S6a
    S6c --> S7a
    S7a --> END

    classDef user fill:#fff3bf,stroke:#f08c00,color:#000
    classDef delegate fill:#d0ebff,stroke:#1971c2,color:#000
    class S4b,S5c user
    class S3a delegate
```

遷移は図に従い、判定基準・詳細は下の本文に従う。

凡例: 黄 = ユーザーの確認・承認、青 = 他スキル・エージェントへの委譲

1. `git status`・`git diff`（未追跡ファイル = 内容確認）で現変更点すべて把握。
2. 変更なし→その旨ユーザーに伝え終了。
3. 変更内容を commit-message-simple スキルへ渡し、コミット単位（ファイル構成）・メッセージ案作成させる。ユーザー「このコミットだけ」等で対象絞った場合は反映。
4. commit-message-simple 手順従い、コミット計画（ファイル構成・メッセージ）をユーザー提示→承認取得。
5. ブランチ名決定。ユーザー指定なし→承認済みコミット prefix・内容から kebab-case ブランチ名を1つ提案（例: `docs/xxx-rule`, `fix/yyy-bug`）→確認取得。
6. 承認取得後 以下順に実行。
   - `git checkout -b <branch>`
   - 承認済みコミット単位ごと: `git add <files>` → `git commit -m "..."`
   - `git push -u origin <branch>`
7. push結果（リモートブランチ名、GitHub 返却 PR 作成 URL あればそれ）をユーザー提示。

## 出力

- 確認フェーズ: コミット計画（commit-message-simple 提案）・ブランチ名案
- 完了フェーズ: 作成ブランチ名、実行コミット一覧、push結果（PR作成URL等）
