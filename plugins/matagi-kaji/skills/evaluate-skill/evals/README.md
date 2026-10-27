# evals

`evaluate-skill` 自身の評価ケース置き場（試験導入）。

`evals.json` = eval 実行用の7ケース（書き換え禁止・対象外・ケース無しの扱い・設定不正で中断・plugins/ 指定の拒否・出力先の確認・明示指定が設定不正に優先）。対象は `../fixture/` の実在する架空スキル・エージェント（`aiueo-skill`・`aiueo-no-evals-skill`・`agents/aiueo-agent.md`）。各プロンプト末尾の指示で、ファイルを触らず計画と応答で判定する。期待値は1観点1つ。「計画に含めたら不合格」を明記。trigger 評価は手動起動専用のため対象外。ケースの書き手は産出者と別エージェント。規約=`shared-rules/skill-roles/skill-roles-rule.md`。
