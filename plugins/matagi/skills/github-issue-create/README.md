# github-issue-create

issue 駆動開発の**作成フェーズ**を担うスキル。issue 化すべきかを判断し、定型フォーマット（概要 / 背景・目的・再現手順 / 要件 / 対応方針）で GitHub issue 本文を組み立て、承認を得てから `gh` CLI で issue 作成。

定義は `SKILL.md`、issue 本文の雛形は `reference/`、判断基準は `shared-rules/issue-driven-development/issue-driven-rule.md` を参照。作成した issue を実装から PR 作成・issue クローズまで進める**実行フェーズ**は `skills/github-issue-resolve/`（PR のマージはユーザーが行う）。
