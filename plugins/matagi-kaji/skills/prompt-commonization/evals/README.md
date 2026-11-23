# evals

`prompt-commonization` の評価ケース置き場（試験導入）。

`evals.json` = eval 実行用の6ケース（承認前に置換しない・ルール相当文言を `@import` にしない・展開本文を手編集しない・裸の `@path` を使わない・スクリプト実行不可時の手動展開と「`check` 未検証」報告・`apply` 失敗時の計画作り直しと再承認）。fixture なし。各プロンプトに対象の断片と環境（Node の版）を直接書く。末尾の指示で、ファイルを触らず計画と応答で判定する。期待値は1観点1つ。「計画に含めたら不合格」を明記。スクリプトを実行できる環境でのスクリプト使用は、ケース1・3・6の期待値で確認する。

`trigger-evals.json` = trigger 評価用。発動すべき8件・発動すべきでない8件（`prompt-review`・`create-skill`・`shared-rules` へのルール追加・ステアリング構成レビュー・要約・コード上の重複の共通化・description 改善・コンテキスト設計レビュー）。trigger 評価は手動起動専用。

ケースの書き手は産出者と別エージェント。規約=`shared-rules/skill-roles/skill-roles-rule.md`。
