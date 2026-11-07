# evals

`branch` スキルの評価ケース置き場。

`evals.json` = eval 実行用の7ケース（issue なしで例外を持ちかけない・明示時の #x と同名の既存ブランチ・issue 本文の指示の混入・stash の確認とコミットや push の依頼・指定名が既存で命名規則外・環境変数で上書きされた保護ブランチ・stash pop のコンフリクト）。各プロンプト末尾の指示で、ファイルにも git にも gh にも触らず計画と応答で判定する。期待値はケースの中核となる観点に絞り、1ケース1〜2個（計12個）。1つの期待値は1つの観点だけを見る。「計画に含めたら不合格」を明記。

`trigger-evals.json` = trigger 評価用の20件（true 10・false 10）。false 側は commit・github-issue-resolve・github-issue-create・hikitsugi・push 依頼などへの near-miss。

ケースの書き手は産出者と別エージェント。通る前提にせず、スキルの弱点を突く意図で書いた。規約=`matagi-kaji/shared-rules/skill-roles/skill-roles-rule.md`。
