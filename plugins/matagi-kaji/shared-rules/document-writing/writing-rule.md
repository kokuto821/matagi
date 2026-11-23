# ドキュメント文体ルール

## 原則

**本リポジトリ（`matagi` / `matagi-kaji`）`.md` 生成・編集 = genshijin 極限レベル。genshijin 側「口調適用確認」不要。**

## 判断基準

| 対象 | どうする |
|------|---------|
| 本文（箇条書き・表・説明文） | genshijin 極限レベル。キーワード中心・漢字連結・矢印因果。識別子・関数名・エラー文字列は略称化禁止 |
| 両プラグイン `documents/` 配下 | 変換禁止（原典格納部分。[[content-fidelity-rule]] 優先） |
| エラーメッセージ引用 | 原文のまま |
| frontmatter | 変換禁止（`name`・`description`・トリガー語句一致維持） |
| コードブロック・mermaid | 変換禁止 |
| `[[link]]` | 変換禁止 |
| 原典・ユーザー発言引用（ユーザー提供原文・ペルソナ定義・発言） | 変換禁止（[[content-fidelity-rule]]） |
| レベル | 極限固定。丁寧・通常 使用禁止 |
| ルール参照（索引・`[[link]]` 周辺） | 参照先の規則内容（要約・列挙・条件）を括弧書き等で書く 禁止。書いてよい = トピック名・実パス併記・関連性を示す一言ラベル。理由 = 参照先変更時 参照側の追従不要化（[[externalization-rule]]）。既存記述 遡及せず 当該行を編集する時のみ是正 |
| 破壊的操作警告・誤読リスク多段手順 | genshijin 本体 Auto-Clarity 従い通常日本語へ切替 |

## 適用手順

1. 対象 変換対象外か 上表確認
2. 対象外以外 極限レベル。意味・強度（禁止・必須・のみ等）・条件・否定 欠落禁止。「〜しない」→「禁止」等 強度上昇も禁止
3. 助詞削除→主語・順序曖昧 なら助詞残す

## やってはいけないこと

- 口調圧縮理由 否定・条件・強度語 欠落
- 原典・エラーメッセージ 圧縮
- 文体変換ついで 内容（意味）変更

## 背景

通常日本語ドキュメント→トークン消費大。genshijin 極限レベル既定→意味不変で効率向上（#73）。

ルール参照時の中身記載禁止（#94）: AGENTS.md 索引・README が「通常レベルを既定」と書いたまま参照先（本ルール）の極限固定と食い違った。参照側へ中身を複製→参照先変更で黙って食い違う。トピック名・パスのみなら追従不要。

## 関連ルール

- [[content-fidelity-rule]]（matagi-kaji/shared-rules/content-fidelity/content-fidelity-rule.md）
- [[externalization-rule]]（matagi-kaji/shared-rules/rule-externalization/externalization-rule.md）
- [[directory-rule]]（matagi-kaji/shared-rules/rules-directory/directory-rule.md）
