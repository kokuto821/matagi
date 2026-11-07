# evals

`branch` スキルの評価ケース置き場。

`evals.json` = eval 実行用の6ケース（issue 番号ありの命名と承認待ち・承認後の最新化から作成と確認の順序・未追跡を含む変更の stash・同名の既存ブランチ・issue 番号なしで例外を持ちかけない・issue 本文の指示の混入）。1ケース = 基本ルール1つ。各プロンプト末尾の「（コマンドは実行せず、進め方だけ答えて）」で、ファイルにも git にも gh にも触らず計画と応答で判定する。期待値は1ケース1〜2個（計10個）。1つの期待値は1つの観点だけを見る。禁止系は「含めたら不合格」を明記。

`trigger-evals.json` = trigger 評価用の20件（true 10・false 10）。false 側は commit・github-issue-resolve・github-issue-create・hikitsugi・push 依頼などへの near-miss。

ケースの書き手は産出者と別エージェント。通る前提にせず、スキルの弱点を突く意図で書いた。規約=`matagi-kaji/shared-rules/skill-roles/skill-roles-rule.md`。
