# プロンプト共通化ルール

## 原則

**複数プロンプトに複製される定型文言 = 共通文言ファイル（1ファイル1文言）へ集約。各プロンプト = `@import` ブロックで参照。正本 = 共通文言ファイル。プロンプト内の展開本文 = 生成物。**

## 判断基準

### `@import` と `[[link]]` の使い分け

| 文言の性質 | どうする |
|-----------|---------|
| 他プロンプトにも効く不変の規約・禁止・基準（ルール相当） | `shared-rules/` へ切出し `[[link]]` 参照（[[externalization-rule]]）。`@import` 不使用 |
| プロンプト文脈にその位置で載る必要のある定型文（出力形式の固定文・図の凡例の固定文・注意書き1文 等） | 共通文言ファイル + `@import` |
| 出どころがルールファイルの記述の写し | `@import` 禁止（値の再掲。[[externalization-rule]] §単一情報源）。`[[link]]` へ寄せる |

根拠ルール参照（`[[link]]`）と文言の写し（`@import`）は併存可。同一文言を両方で担わない。

### 記法

共通文言ファイル:

- 1ファイル = 1文言。ファイル全体 = 展開される本文。ファイル名（kebab-case）= 識別子。キー・見出し指定なし
- frontmatter・`@import` ブロックを含めない
- 置き場ディレクトリ = 実行時にユーザーが決定。スキルから読める場所を推奨。既定の推奨 = 対象リポジトリ直下 `prompt-commons/`

参照ブロック（プロンプト本文中）:

```
<!-- @import prompt-commons/injection-guard.md -->
（展開本文。生成物）
<!-- @end -->
```

- パス = 対象リポジトリのルート相対
- 開始行・終了行 = 各々単独行。ネスト禁止
- frontmatter・コードフェンス内 = 走査対象外
- 展開本文 = 手編集禁止。変更 = 共通文言ファイルを編集 → `expand`
- 裸の `@path` で書かない。理由 = Claude Code が `@path` をファイル添付と解釈し、共通文言ファイル全体が文脈へ二重に載る（[[at-reference-behavior]]、実パス `plugins/matagi-kaji/documents/reference/harness-engineering/at-reference-behavior.md`）。`@` 直後は必ず `import`

### 満たすべき条件

| 条件 | 内容 |
|------|------|
| 冪等 | `expand` 再実行で差分なし |
| 同期 | 展開本文 = 共通文言ファイルの内容。食い違い = `check` 実行時に検出 |
| 単一の正 | 文言の改訂 = 共通文言ファイル1箇所のみ |

`check` の起動 = スキルまたは利用者の実行に依存。自動では強制されない。導入先で CI 等から `check` を呼ぶのは任意。

### 検出と承認

- 候補列挙 = スクリプト（完全一致 + 正規化後の近似一致）。意味同一・抽出粒度・文言ファイル名の判断 = モデル。確定 = ユーザー承認
- 置換の単位 = 行全体。文候補が他の文と同じ行にある場合、計画の出現箇所は行全体を指し、共通文言ファイルの本文も行全体にする。行の一部だけを置換する計画は作らない（`expectedText` は行全体との一致で検証される）
- 閾値・最小文字数の既定値 = スクリプト側が正。本ルールに再掲しない
- 置換・新規文言ファイル作成 = ユーザー承認後のみ。適用 = スクリプト `apply`（[[review-independence-rule]]）
- 承認なしで置換 禁止。計画から外れた変更 禁止

### スクリプトを実行できない環境

- 検出・適用・展開・検証 = スクリプト実行が原則
- 実行不可の場合のみ、モデルによる手動展開を許可
- 手動展開した結果 = 「`check` 未検証」と必ず報告。スクリプト実行可能な環境での `check` 再実行を促す。検証済み扱い 禁止

## やってはいけないこと

- 展開本文の手編集
- ルール相当の文言の `@import` 化
- 裸の `@path` での参照
- 承認前の置換・文言ファイル作成
- 実行できたのに手動展開で済ませる

## 背景

issue #106。スキル・エージェント間の定型文複製 → 改訂時の黙ったドリフト防止。

設計判断 = スクリプト展開 + 同期検証。根拠 = [[at-reference-behavior]]。

## 関連ルール

- [[externalization-rule]]（matagi-kaji/shared-rules/rule-externalization/externalization-rule.md）— ルール相当の文言は `[[link]]`
- [[review-independence-rule]]（matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md）— 適用前の承認
- [[directory-rule]]（matagi-kaji/shared-rules/rules-directory/directory-rule.md）— 配置・記法
- [[at-reference-behavior]]（matagi-kaji/documents/reference/harness-engineering/at-reference-behavior.md）— `@path` の実機検証メモ
