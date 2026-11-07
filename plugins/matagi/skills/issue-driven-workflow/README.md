# issue-driven-workflow

issue 駆動開発**実行フェーズ**担当スキル。既存 issue を1件選び、ブランチ作成 → 実装方針合意 → 実装 → セルフレビュー → コミット・push → 完了条件の突き合わせ → PR 作成・CI 確認まで一気通貫。PR のマージはユーザーが行い、issue はマージ時に PR 本文の `Closes #<番号>` で閉じる（完了条件に未達が残る場合は `Refs #<番号>` で開いたまま）。

実装・レビュー中身 = 既存スキル（`tdd-workflow` / `coding` / `coding-review` など）へ委譲。本スキル自身 = フェーズ進行・GitHub 操作のみ担当。

定義 = `SKILL.md`、判断基準 = `shared-rules/issue-driven-development/issue-driven-rule.md` 参照。issue を新規作る**作成フェーズ** = `skills/github-issue-create/`。
