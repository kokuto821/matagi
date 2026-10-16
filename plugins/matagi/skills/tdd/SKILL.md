---
name: tdd
description: >
  「TDDで進めて」「テスト駆動で実装して」「Red-Green-Refactorで」と言われたとき、
  TDD の List→Red→Green→Refactor→Commit サイクルを統括するオーケストレーター。
  各フェーズを既存の産出者・レビュアーへ委譲する。
---

# tdd

役職: **シカリ**（統括）。Red-Green-Refactor サイクル指揮。

## 概要

`tdd-rule` を唯一の根拠に、TDD サイクルの各フェーズを適切な産出者・レビュアーへ委譲。List/Red/Green/Refactor はいずれも domain（frontend/backend 等）を問わない単一の入口スキル（`test-coding` / `coding` / `coding-review`）へ委譲。domain 判定と具象サブエージェントへの分岐は各入口スキル側の責務。tdd スキル自身は domain の詳細に関与せず、フェーズ進行のみ統括。指摘の適用はレビュー独立性に従い産出者が担う。

## ルール

- サイクル（List-Red-Green-Refactor-Commit）とコーディング標準は [[tdd-rule]]（`shared-rules/coding-conventions/tdd-rule.md`）に従う。「Red-Green-Refactor」は通称。正確には List を含む5フェーズ（[[tdd-rule]] §2）。フェーズを飛ばさず、現フェーズ（LIST/RED/GREEN/REFACTOR/COMMIT）を常に明示。
- レビューと修正適用の分離は [[review-independence-rule]] に従う。Refactor のレビューも産出者と別エージェントが行い、適用は産出者に戻す。
- **産出者の単一責任**: List/Red は `test-coding` スキル、Green と Refactor の適用は `coding` スキルの責任。各スキルは自担当フェーズのみ担い、他フェーズの産出や自己完結はしない。Refactor の実装適用を Green と同じ `coding` スキルに揃える理由: レビュー（別エージェント）と適用（産出者）の分離（[[review-independence-rule]]）を保ったまま、実装を担う産出者を一貫させるため。
- **隔離（エージェント委譲）の理由は2種類。混同しない**:
  - **産出フェーズ（List/Red/Green）の隔離**: [[selection-rule]] の「隔離したい副次タスク」基準による。テスト・実装の試行錯誤はメイン会話を汚しやすいため、`test-coding` / `coding` スキルは in-context 起動しつつ、実際のコード生成は domain 判定の上で専用（または汎用）サブエージェントへ隔離委譲（[[domain-classification-rule]]）。最終的な実装・テストコードの結果だけ確認できればよく、生成過程の逐次可視性は要求しない、という判断（issue #17 で明示的に承認済み）。
  - **Refactor フェーズの隔離**: [[review-independence-rule]] による。産出者本人には自作物の甘さ・盲点があるため、産出者と別エージェントにレビューさせる。理由は「メインを汚すから」でなく「自己評価を信頼しない」こと。
  - 両者は理由が異なる。一方の説明を他方に流用しない。
- **委譲の種別**: スキル起動／エージェント委譲の定義は [[selection-rule]] 参照（再掲しない）。`test-coding` / `coding` / `coding-review` はいずれも tdd から in-context 起動。各スキル内部が domain 判定の上、具象（または汎用）サブエージェントへ隔離委譲。
- **反復上限**: 1機能あたり最大 3 サイクルを目安とする（サイクル・周の定義は [[tdd-rule]] §2「Refactor の実施粒度」）。3 サイクルで緑にならない／未解決が残る場合は、サイクルを続けず、達成範囲と残課題を報告して人の判断を仰ぐ。対話の中で守る目安であり、ハーネスによる強制ではない（暴走はメインスレッドで可視・中断可能）。上限を確実に強制したい場合のみ、commit を捕捉する hook を別途用意。
- **Refactor の実施粒度**: Red-Green とは別に、まとめて1回だけ行う（詳細・理由は [[tdd-rule]] §2「Refactor の実施粒度」参照。ここで再掲しない）。
- **Refactor の停止条件**: 対象が1issue全体に広がるため、レビュー→適用は複数ラウンド許容、ただし無制限には反復しない。**最大 5 ラウンド**を目安とし、途中で指摘が収束すればそこで打ち切り。5 ラウンドに達しても収束しない場合は、反復を続けず残課題として報告して人の判断を仰ぐ。反復上限と同様、対話の中で守る目安でありハーネスによる強制ではない。各ラウンド境界で、そのラウンドの指摘要旨と適用状況（適用済み／未適用）を `tdd-notes.md` に数行退避してから次ラウンドへ進む（ルール「サイクルをまたぐ記憶」）。
- **サイクルをまたぐ記憶**: 決定・未解決事項・次サイクルの狙いを、スクラッチパッドの `tdd-notes.md` に数行で退避し、次サイクル冒頭で読み直す（[[long-horizon-rule]]）。
- 規約の具体値は再掲せず、上記ルールを唯一の正として参照（[[externalization-rule]]）。

## 手順

```mermaid
flowchart TD
    START(["START"])
    END(["END"])

    subgraph L1["1 List と Red 失敗するテストを書く"]
        S1a["test-coding を起動し テストリストを洗い出して 1項目の失敗するテストを実装させる"]
        S1b["テストが RED であることを確認する"]
        S1a --> S1b
    end

    subgraph L2["2 Green テストを通す最小実装"]
        S2a["coding を起動し テストを通す最小限の実装をさせる"]
        S2b["全テストが GREEN であることを確認し 中間コミットする"]
        S2a --> S2b
    end

    subgraph L3["3 反復"]
        S3a{"テストリストが空か？"}
        S3b{"反復上限に達したか？"}
        S3c["達成範囲と残課題を報告し 人の判断を仰ぐ"]
        S3a -->|NO| S3b
        S3b -->|YES| S3c
    end

    subgraph L4["4 Refactor レビュー主導の改善"]
        S4a["coding-review を起動し 指摘のみ受け取る"]
        S4b{"指摘があるか？"}
        S4c["産出者が全テスト緑を維持したまま指摘を適用する"]
        S4d["ラウンドの指摘要旨と適用状況を tdd-notes.md に退避する"]
        S4e{"ラウンド上限まで適用済みか？"}
        S4f["残課題を報告し 人の判断を仰ぐ"]
        S4a --> S4b
        S4b -->|YES| S4e
        S4e -->|YES| S4f
        S4e -->|NO| S4c
        S4c --> S4d
        S4d --> S4a
    end

    subgraph L5["5 Commit チェックポイントを記録"]
        S5a["全テストが緑であることをテスト実行で最終確認する"]
        S5b["git add して 意味ある単一作業単位でコミットし ノートを退避する"]
        S5a --> S5b
    end

    subgraph L6["6 次サイクルへ"]
        S6a{"Refactor 中に気づいた新規テスト項目があるか？"}
        S6b{"反復上限に達したか？"}
        S6a -->|YES| S6b
    end

    START --> S1a
    S1b --> S2a
    S2b --> S3a
    S3a -->|YES| S4a
    S3b -->|NO| S1a
    S3c --> END
    S4b -->|NO| S5a
    S4f --> END
    S5b --> S6a
    S6a -->|NO| END
    S6b -->|NO| S1a
    S6b -->|YES| S3c

    classDef user fill:#fff3bf,stroke:#f08c00,color:#000
    classDef delegate fill:#d0ebff,stroke:#1971c2,color:#000
    class S3c,S4f user
    class S1a,S2a,S4a,S4c delegate
```

遷移は図に従い、判定基準・詳細は下の本文に従う。

凡例: 黄 = ユーザーの確認・承認、青 = 他スキル・エージェントへの委譲

1. **List — テストリストを洗い出す** / **Red — 失敗するテストを書く**
   - `test-coding` スキルを in-context 起動。同スキルが検証すべき振る舞いのシナリオを洗い出し（List。[[tdd-rule]] Phase 0）、リストから1項目を選んで失敗するテストを実装（Red。[[tdd-rule]] Phase 1）。「失敗するテストのみ実装、実装コードは書かない」と明示。Red の実装段階では同スキル内部で domain 判定の上、対応するサブエージェント（例: `frontend-tester` / `backend-tester`、専用サブエージェントが無い domain は汎用サブエージェント）へ隔離委譲（[[domain-classification-rule]]）。テストが RED であることを確認。
2. **Green — テストを通す最小実装**
   - `coding` スキルを in-context 起動。テストは Red で用意済みのため実装のみ。同スキル内部で domain 判定の上、対応するサブエージェント（例: `frontend-coder` / `backend-coder`、専用サブエージェントが無い domain は汎用サブエージェント）へ隔離委譲（[[domain-classification-rule]]）。テストを通す最小限にとどめ、余分な機能を足さない。全テストが GREEN であることを確認したら、その時点で中間コミット（ルール「Refactor の実施粒度」）。
3. **反復** — テストリストが空になるまで手順1〜2（List/Red → Green）を繰り返す（[[tdd-rule]] Phase 4）。反復上限（ルール「反復上限」）に達していなければ、リストの次の項目で手順1へ戻る。Refactor はこの反復に含めない。
4. **Refactor — レビュー主導の改善（緑を保つ、テストリスト全項目完了後にまとめて1回）**
   - `coding-review` スキルを in-context 起動。同スキル内部で domain 判定の上、コーディング規約・テスト規約（frontend なら追加で UI デザイン）の観点で該当レビューサブエージェントへ隔離委譲、指摘のみ返る。指摘を受け、産出者（Green と同じ `coding` スキルが委譲した実装）が全テスト緑を維持したまま適用。レビュー→適用は複数ラウンド許容だが**最大5ラウンドで打ち切り**（ルール「Refactor の停止条件」）。指摘が収束するまで、または5ラウンドに達するまで繰り返す。
5. **Commit — チェックポイントを記録**
   - 全テストが緑であることを最終確認（テスト実行で担保。[[review-independence-rule]]: 再検証も産出本人に委ねない）→ `git add` → 意味ある単一作業単位でコミット。手順2の中間コミットとは別に、Refactor 適用分をこのコミットに含める。サイクルのノート退避（ルール「サイクルをまたぐ記憶」）を行う。
6. **次サイクルへ** — Refactor 中に気づいた新規テスト項目がありリストが空でない場合（[[tdd-rule]] Phase 3「Refactor 中の新規項目」）、反復上限（ルール「反復上限」）未到達なら、次サイクルの手順1（List/Red）へ戻る。上限到達ならルールに従い終了。

## 出力

- 現フェーズ（LIST/RED/GREEN/REFACTOR/COMMIT）、委譲先（入口スキルと、判明していれば内部で分岐した具象サブエージェント）と結果、テストの緑/赤状態、コミット単位（中間コミット／Refactor 後のコミットの別）、サイクル番号（例: 2 サイクル目）。
