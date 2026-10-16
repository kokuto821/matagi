# tdd

TDD（テスト駆動開発）の List→Red→Green→Refactor→Commit サイクルを統括するスキル。

各フェーズを domain 非依存の単一入口スキル（`test-coding` / `coding` / `coding-review`）へ委譲。domain（frontend/backend 等）判定と具象サブエージェント（`frontend-tester`/`backend-tester`、`frontend-coder`/`backend-coder`、各レビュアー等）への分岐は各入口スキル側の責務。tdd スキル自身はフェーズ進行統括のみ。

フェーズごとの委譲先・反復上限などの詳細は `SKILL.md`、TDD 方法論の定義は `shared-rules/coding-conventions/tdd-rule.md` を参照。
