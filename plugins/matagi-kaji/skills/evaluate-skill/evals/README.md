# evals

`evaluate-skill` 自身の評価ケース置き場（試験導入）。

`evals.json` = eval 実行用の6ケース（書き換え禁止・対象外・ケース無しの扱い・設定不正で中断・plugins/ 指定の拒否・出力先の確認）。対象パスは架空。各プロンプト末尾の指示で、ファイルを触らず計画と応答で判定する。trigger 評価は手動起動専用のため対象外。ケースの書き手は産出者と別エージェント。規約=`shared-rules/skill-roles/skill-roles-rule.md`。
