# issue-driven-development

issue 駆動開発（issue を起点に実装・PR・マージまで進める進め方）の判断基準の置き場。

`issue-driven-rule.md` に、issue 化すべきかの判断・issue の粒度・必ず issue に紐づくブランチで作業すること・1 issue = 1 branch = 1 PR の対応・副作用を伴う GitHub 操作の承認を集約。

うち保護ブランチ上での変更・コミット・push は `hooks/protected-branch-guard.ts` が実際にブロック。ルールが散文で担うのは「どの issue に紐づけるか」「いつブランチへ移動するか」の判断。

フェーズごとの実際の手順は `skills/github-issue-create/` と `skills/github-issue-resolve/`。
