# github-issue-resolve

issue 駆動開発の**実行フェーズ**を担うスキル。既存 issue を1件選び、ブランチ作成 → 実装方針の合意 → 実装 → セルフレビュー → PR 作成 → issue クローズまでを一気通貫で進める。PR のマージはユーザーが行う。

実装・レビューの中身は既存スキル（`tdd` / `coding` / `coding-review` など）へ委譲。本スキル自身はフェーズ進行と GitHub 操作のみ担当。

定義は `SKILL.md`、判断基準は `shared-rules/issue-driven-development/issue-driven-rule.md` を参照。issue を新規に作る**作成フェーズ**は `skills/github-issue-create/`。
