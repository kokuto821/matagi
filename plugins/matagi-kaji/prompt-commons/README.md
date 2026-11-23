# prompt-commons

スキル・サブエージェントに複製されていた定型文の共通文言ファイル置き場。1ファイル = 1文言。ファイル名（kebab-case）が識別子。

各プロンプトは `<!-- @import plugins/matagi-kaji/prompt-commons/<name>.md -->` ブロックで参照する。ブロック内の本文は展開結果（生成物）で、直接編集しない。文言を変える場合は本ディレクトリのファイルを編集し、`prompt-commonization` スキルの `expand` で展開本文を同期、`check` で整合を確認する。

判断基準・記法 = `shared-rules/prompt-commonization/commonization-rule.md`。ルール相当の文言は置かず、`shared-rules/` から `[[link]]` で参照する。

## 運用上の注意

- 共通化の目的 = 複製文言のドリフト防止。トークン削減ではない。展開本文は各プロンプトに残るうえ、ブロックのコメント行ぶん実行時の文字数は増える。
- 対象 = `plugins/matagi-kaji/` の `skills/*/SKILL.md`・`agents/*.md`。`plugins/matagi/` 側は未対応（必要なら別 issue）。
- `template/` は対象外。複製先に本ディレクトリが無く `check` が壊れるため、素の固定文のまま置く（`shared-rules/template/template-rule.md`）。
- テンプレートから新規作成したスキル・エージェントは素の固定文で生まれる。複製を残さないため、作成後に `prompt-commonization` の `detect` で取り込む。
- 「凡例: 黄 = ユーザーの確認・承認」のみの行は短文のため、共通化していない。
- `ai-engineering-review` の「各エージェントへ…旨を渡す。」は複数宛ての意図的な差分のため、`review-agent-handoff.md` を使わない。
- `README.md` は共通文言ファイルではない。文言ファイルは本 README 以外の `*.md`。

導入の経緯は issue #108。
