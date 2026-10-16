# rules ディレクトリ規約

## 目的

ルール = `shared-rules/`（参照層）1ディレクトリで扱う。任意タイミング参照の共通ルールを置き、AGENTS.md 索引・`[[link]]` で必要時参照（コンテキスト圧迫回避）。

| ここに置くもの | ここに置かないもの |
|---------------|-----------------|
| 命名規則・構造ルール等 普遍的制約 | 特定タスクの手順（→ skills） |
| Claude の判断基準ポリシー | 調査・参考資料（→ documents） |
| 繰り返し参照される設計上決定 | 経験・知見メモ（→ knowledge） |

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

ディレクトリ名を短縮 → ファイル名（`naming-conventions/` → `naming-rule.md`）。

## 本文テンプレート

新規ルールの雛形: `plugins/matagi/template/rules/RULE.md`。

構成「原則（必須）→ 判断基準 → 適用手順 → やってはいけないこと → 背景 → 関連ルール」。不要節は削除可。ただし**原則は省略しない**。ルールには *判断基準* のみ書く。事実・挙動の説明は `documents/reference/` に置く。

## スコープ（`paths:`）

冒頭 frontmatter の `paths:` でルールを効かせるファイルを glob 指定可能。

| スコープ | 意味 | 向くルール |
|---------|------|-----------|
| `paths:` なし（frontmatter 省略） | 未スコープ。セッション開始時に常時ロード | 命名・構造など普遍的制約 |
| `paths:` あり | 一致ファイルに触れた時のみロード | 一部の層・拡張子のみ効く規約 |

普遍的制約は未スコープでよい。一部対象のみ効く規約は `paths:` でスコープ → 無関係セッションのトークン消費回避。判断は [[selection-rule]] に従う。

> **本 kit での運用**: `shared-rules/` は自動ロードせず、AGENTS.md 索引・skills から `[[link]]` で必要時参照。frontmatter の `paths:` は一般挙動の説明。導入先で native rule 化した際に効く。

## 相互リンク記法（`[[slug]]`）

rules・skills・agents・AGENTS.md 等 本 kit の md 資産間相互参照は `[[slug]]` で書く。**記法定義はここを唯一の正とし、各 README・テンプレート側で再定義しない。**

- **slug = 参照先ファイル名から拡張子を除いた基本名**（見出し・タイトルではない）。例: `[[naming-rule]]` → `naming-conventions/naming-rule.md`。ファイル名基準なので表記不変。
- Obsidian 由来記法。**Claude Code / ハーネスのネイティブ機能ではない**。自動解決・自動ロード・クリック遷移なし。Claude が意味として辿り、必要に応じ実ファイルを検索して開く**慣習的参照**にすぎない。
- 別ディレクトリのファイル・確実に辿らせたい参照は `[[severity-rule]]（shared-rules/review-severity/severity-rule.md）` のように**実パスを併記**。機械的に解決可能なのは併記した実パス。`[[slug]]` は人間・モデル向け意味ラベル。
- **プラグイン跨ぎ参照**（`matagi` ⇄ `matagi-kaji`）: 実パス先頭に参照先プラグイン名を付ける。例: `matagi` 側から `matagi-kaji` 側ルールを指す場合 `[[harness-rule]]（matagi-kaji/shared-rules/harness-engineering/harness-rule.md）`。自プラグイン内参照は従来どおりプラグインルート相対パス（`shared-rules/...`）でよい。
- `shared-rules/` が `[[link]]` 参照運用される背景: 上記「本 kit での運用」参照。

## 新規作成 vs 既存更新

- **既存ルールと同トピック** → 既存ファイルに追記
- **新トピック** → 新サブディレクトリ＋新ファイル作成
- 1ディレクトリに複数ファイルを作らない（分割必要 → 別トピックとして切り出す）
