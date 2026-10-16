# tdd

TDD（テスト駆動開発）List→Red→Green→Refactor→Commit サイクルを統括するスキル。

各フェーズを domain 非依存単一入口スキル（`test-coding` / `coding` / `coding-review`）へ委譲。domain（frontend/backend 等）判定・具象サブエージェント（`frontend-tester`/`backend-tester`、`frontend-coder`/`backend-coder`、各レビュアー等）への分岐 = 各入口スキル側責務。tdd スキル自身 = フェーズ進行統括のみ。

フェーズごと委譲先・反復上限などの詳細 = `SKILL.md`、TDD 方法論定義 = `shared-rules/coding-conventions/tdd-rule.md` 参照。
