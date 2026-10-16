# context-engineering ルール索引

有限な注意予算（コンテキスト）のランタイムキュレーション、長時間軸タスクの文脈維持。そのルール群の**索引（ルーター）**。全部は読み込まない。**まず本索引を読み、扱う関心事に該当するルールだけ読む**運用。

`prompt-engineering/` = 「1回のプロンプトの中身」、`harness-engineering/` = 「命令の置き場所・手法選択」。本領域 = **「進化し続ける情報の宇宙から、限られたウィンドウに何を入れ続けるか」**。出典: `documents/reference/context-engineering/`。

## 全体構成

```
context-engineering/
├── budget-rule.md       ← コンテキストは有限資源（最小集合・注意予算・context rot）
├── assembly-rule.md     ← 構成・組み立て（altitude・セクション分割・部品の連結）
├── retrieval-rule.md    ← ランタイム取得（効く検索・JIT・漸進的開示・ハイブリッド）
├── long-horizon-rule.md ← 長時間軸（早期コンパクション・ノート取り・サブエージェント）
└── tool-design-rule.md  ← ツール設計とコンテキスト効率
```

## 利用ガイド（いつどれを読むか）

| 関心事 | ルール |
|--------|--------|
| 「詰め込むほど良い」不成立前提 情報量を絞りたい | `budget-rule.md` |
| システムプロンプト／指示の高度・区切り・部品並べ方を設計したい | `assembly-rule.md` |
| 全ロードせず実行時 必要分だけ取得する設計にしたい | `retrieval-rule.md` |
| ウィンドウ超過の長時間タスク 一貫性維持したい（compact/ノート/サブエージェント） | `long-horizon-rule.md` |
| ツールセット肥大化回避、トークン効率良いツール設計したい | `tool-design-rule.md` |

各ルールは `[[budget-rule]]` のように `[[wikilink]]` 相互参照（記法定義: [[directory-rule]]（`shared-rules/rules-directory/directory-rule.md`）「相互リンク記法」）。
