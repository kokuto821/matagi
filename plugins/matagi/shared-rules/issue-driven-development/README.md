# issue-driven-development

issue 駆動開発（issue 起点に実装・PR・マージまで進める進め方）判断基準置き場。

`issue-driven-rule.md` に、issue 化すべきか判断・issue 粒度・必ず issue 紐づくブランチで作業・1 issue = 1 branch = 1 PR 対応・副作用伴う GitHub 操作承認を集約。

うち保護ブランチ上の変更・コミット・push = `hooks/protected-branch-guard.ts` が実際にブロック。ルールが散文で担う = 「どの issue に紐づけるか」「いつブランチへ移動するか」判断。

フェーズ別実際手順 = `skills/github-issue-create/` と `skills/github-issue-resolve/`。
