# context-engineering ルール索引

有限な注意予算（コンテキスト）をランタイムでどうキュレーションし、長時間軸タスクで文脈をどう維持するか。そのルール群の**索引（ルーター）**。全部は読み込まない。**まずこの索引を読み、扱う関心事に該当するルールだけ読む**運用。

`prompt-engineering/` は「1回のプロンプトの中身」、`harness-engineering/` は「命令の置き場所・手法選択」。本領域は**「進化し続ける情報の宇宙から、限られたウィンドウに何を入れ続けるか」**。出典は `documents/reference/context-engineering/`。

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
| 「詰め込むほど良い」が成り立たない前提で情報量を絞りたい | `budget-rule.md` |
| システムプロンプト／指示の高度・区切り・部品の並べ方を設計したい | `assembly-rule.md` |
| 全ロードせず実行時に必要分だけ取りに行く設計にしたい | `retrieval-rule.md` |
| ウィンドウ超過の長時間タスクで一貫性を保ちたい（compact/ノート/サブエージェント） | `long-horizon-rule.md` |
| ツールセット肥大化を避け、トークン効率のよいツールを設計したい | `tool-design-rule.md` |

各ルールは `[[budget-rule]]` のように `[[wikilink]]` で相互参照（記法の定義は [[directory-rule]]（`shared-rules/rules-directory/directory-rule.md`）「相互リンク記法」）。
