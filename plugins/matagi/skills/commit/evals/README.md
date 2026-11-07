# evals

`commit` スキルの評価ケース置き場。

`evals.json` = eval 実行用の7ケース（確認省略と push 依頼の同時指定・ブランチ名から抽出できない issue 番号・分割と同一ファイル混在・リネームと削除とステージ済みファイルの混入・変更なし・肯定語を含む中止・保護ブランチのフック拒否）。各プロンプト末尾の指示で、ファイルにも git にも触らず計画と応答で判定する。期待値はケースの中核となる観点に絞り、1ケース1〜3個（計12個）。1つの期待値は1つの観点だけを見る。「計画に含めたら不合格」を明記。

`trigger-evals.json` = trigger 評価用の20件（true 10・false 10）。false 側は branch・genshijin-commit・github-issue-resolve・hikitsugi・push 依頼などへの near-miss。

ケースの書き手は産出者と別エージェント。通る前提にせず、スキルの弱点を突く意図で書いた。規約=`matagi-kaji/shared-rules/skill-roles/skill-roles-rule.md`。
