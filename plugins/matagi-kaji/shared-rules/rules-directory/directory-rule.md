# rules ディレクトリ規約

## 目的

ルールは `shared-rules/`（参照層）1ディレクトリで扱う。任意タイミングで参照する共通ルールを置き、AGENTS.md 索引・`[[link]]` で必要時に参照（コンテキスト圧迫回避）。

| ここに置くもの | ここに置かないもの |
|---------------|-----------------|
| 命名規則・構造ルールなど普遍的な制約 | 特定タスクの手順（→ skills） |
| Claude の判断基準になるポリシー | 調査・参考資料（→ documents） |
| 繰り返し参照される設計上の決定 | 経験・知見メモ（→ knowledge） |

## ディレクトリ構造

**全ルールはサブディレクトリに入れる。`shared-rules/` 直下にルールファイルを直置きしない。**

```
shared-rules/
├── README.md                        ← shared-rules/ の説明のみ。直下に置く唯一の例外
├── <topic>/
│   └── <short-name>-rule.md
└── ...
```

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| サブディレクトリ名 | kebab-case・トピックを表す名詞句 | `naming-conventions`, `repository-structure` |
| ルールファイル名 | `<短縮トピック>-rule.md` | `naming-rule.md`, `structure-rule.md` |

ディレクトリ名を短縮してファイル名にする（`naming-conventions/` → `naming-rule.md`）。

## 本文テンプレート

新規ルールは `plugins/matagi/template/rules/RULE.md` を雛形にする。

構成は「原則（必須）→ 判断基準 → 適用手順 → やってはいけないこと → 背景 → 関連ルール」。不要な節は削除可。ただし**原則は省略しない**。ルールには *判断基準* のみ書く。事実・挙動の説明は `documents/reference/` に置く。

## スコープ（`paths:`）

冒頭 frontmatter の `paths:` で、ルールを効かせるファイルを glob 指定可能。

| スコープ | 意味 | 向くルール |
|---------|------|-----------|
| `paths:` なし（frontmatter 省略） | 未スコープ。セッション開始時に常時ロード | 命名・構造など普遍的な制約 |
| `paths:` あり | 一致ファイルを触った時だけロード | 一部の層・拡張子にだけ効く規約 |

普遍的な制約は未スコープでよい。一部の対象にしか効かない規約は `paths:` でスコープし、無関係なセッションでのトークン消費を避ける。判断は [[selection-rule]] に従う。

> **本 kit での運用**: `shared-rules/` は自動ロードせず、AGENTS.md 索引・skills から `[[link]]` で必要時に参照。frontmatter の `paths:` は一般挙動の説明。導入先で native rule 化した際に効く。

## 相互リンク記法（`[[slug]]`）

rules・skills・agents・AGENTS.md など本 kit の md 資産どうしの相互参照は `[[slug]]` で書く。**この記法の定義はここを唯一の正とし、各 README・テンプレート側で再定義しない。**

- **slug は参照先ファイル名から拡張子を除いた基本名**（見出しやタイトルではない）。例: `[[naming-rule]]` → `naming-conventions/naming-rule.md`。ファイル名基準なので表記は不変。
- Obsidian 由来の記法。**Claude Code / ハーネスのネイティブ機能ではない**。自動解決・自動ロード・クリック遷移なし。Claude が意味として辿り、必要に応じて実ファイルを検索して開く**慣習的な参照**にすぎない。
- 別ディレクトリのファイルや、確実に辿らせたい参照は `[[severity-rule]]（shared-rules/review-severity/severity-rule.md）` のように**実パスを併記**。機械的に解決可能なのは併記した実パス。`[[slug]]` は人間・モデル向けの意味ラベル。
- **プラグインを跨ぐ参照**（`matagi` ⇄ `matagi-kaji`）は、実パスの先頭に参照先のプラグイン名を付ける。例: `matagi` 側から `matagi-kaji` 側のルールを指す場合は `[[harness-rule]]（matagi-kaji/shared-rules/harness-engineering/harness-rule.md）`。自プラグイン内の参照はこれまでどおりプラグインルート相対のパス（`shared-rules/...`）でよい。
- `shared-rules/` が `[[link]]` 参照で運用される背景は、上記「本 kit での運用」を参照。

## 新規作成 vs 既存更新

- **既存ルールと同じトピック** → 既存ファイルに追記
- **新しいトピック** → 新サブディレクトリ＋新ファイルを作成
- 1ディレクトリに複数ファイルを作らない（分割が必要なら別トピックとして切り出す）
