# 設計原則ルール

コード設計普遍原則（DRY・SRP・関心の分離・疎結合/高凝集・情報隠蔽/カプセル化・KISS・YAGNI・ETC）の実務適用**観点（チェックリスト）**規定。
各原則**定義** = [[design-principles-glossary]]（`documents/reference/design/design-principles-glossary.md`）§コード設計の中核原則 を唯一の正、本ルールで定義再掲しない。役割分担 ── 定義＝glossary、適用観点＝本ルール。

## 原則

**重複を持たず（DRY）、各単位は単一の責務を持ち（SRP）、関心を分離（SoC）して疎結合・高凝集に保ち、変わりやすい実装詳細は境界の内に隠す（情報隠蔽/カプセル化）。過剰な複雑さ・機能を持ち込まず（KISS / YAGNI）、迷えば変更しやすい方を選ぶ（ETC）。** 言語・フレームワーク非依存のコード設計土台。実装・リファクタ・レビュー共通判断基準。

## 判断の観点

各原則充足確認 = 以下（各原則定義 [[design-principles-glossary]]）。

| 原則 | 満たしているかの観点 |
|------|--------------------|
| **DRY** | 同じロジック・値が複数箇所に散っていないか。変更時に複数箇所を直す必要が生じないか。 |
| **単一責任 (SRP)** | 「このユニットは何をするか」を一言で言えるか。変更理由が複数ないか。 |
| **関心の分離 (SoC)** | 無関係な関心が同じ関数・モジュールに同居していないか。 |
| **疎結合・高凝集** | 一部を変えて広範囲に影響しないか。関連ロジックが分散していないか。 |
| **情報隠蔽・カプセル化** | 実装詳細が公開インターフェースから漏れていないか。変更が境界を越えて波及しないか。呼び出しが遠い相手の内部構造を辿っていないか（`a.b().c().d()`）。 |
| **KISS** | より単純な代替はないか。技巧・過度な一般化に走っていないか。 |
| **YAGNI** | 現要件にない汎用化・将来対応・投機的な拡張を作り込んでいないか。 |
| **ETC（変更しやすさ）** | この構造は将来の変更を容易にするか。変更コストを下げる方向か。 |

## やってはいけないこと

- 同値・同ロジックを複数箇所にコピー保持（DRY 違反）。共通化し一箇所に置く。
- 1関数・モジュールに複数責務・関心を詰め込む（SRP / SoC 違反）。
- 実装詳細を公開インターフェースから漏らす／呼び出しが遠い相手の内部構造を辿る（情報隠蔽・デメテルの法則 違反）。
- まだ必要でない機能・汎用化・拡張点を先回り作成（YAGNI 違反）。単純手段あるのに技巧で複雑化（KISS 違反）。
- 各原則定義を本ルールや参照元（実装・テスト・レビューのルール・エージェント）に再掲。定義 = [[design-principles-glossary]] を唯一の正、本ルール = 観点のみ保持（値の二重管理回避。[[externalization-rule]]（`matagi-kaji/shared-rules/rule-externalization/externalization-rule.md`）§単一情報源）。

## 背景

DRY・SRP・疎結合/高凝集定義が `coding-conventions/tdd-rule.md`・`coding-conventions/coding-rule.md`・各レビュー/テストエージェントに散在、文言ずれ始めた。役割二分 ── **定義** = 用語集 [[design-principles-glossary]] に一本化、本ルール = **適用時観点**のみ保持。ドキュメント/資産側重複回避（単一情報源）= [[externalization-rule]] 担当、本ルール = コード側判断観点担当。

中核原則に含めない周辺設計法則・用語（SOLID・UNIX哲学・分散システム定番・認知バイアス・比喩など、判断観点として単独では機能しないもの）も [[design-principles-glossary]] に定義を置く。

## 関連ルール・資料

- [[design-principles-glossary]]（`documents/reference/design/design-principles-glossary.md`） — 各原則定義の唯一の正／周辺設計法則・比喩の用語集
- [[tdd-rule]]（`shared-rules/coding-conventions/tdd-rule.md`） — Red-Green-Refactor サイクル（Refactor で本原則を適用）
- [[coding-rule]]（`shared-rules/coding-conventions/coding-rule.md`） — 実装全般規約（関数設計で本原則を適用）
