# test-coding

TDD の List（テストリスト洗い出し）と Red（失敗するテストを書く）を担うスキル。テスト観点を洗い出しテストケースを設計後、対象コードを分析して domain を判定。対応する専門サブエージェント（`frontend-tester` / `backend-tester` 等）へ実装を委譲する domain 非依存の単一入口。

定義は `SKILL.md`、テスト設計技法は `shared-rules/test-design/test-design.md`、TDD List/Red フェーズの考え方は `shared-rules/coding-conventions/tdd-rule.md`、domain 判定基準・委譲方針は `shared-rules/coding-conventions/domain-classification-rule.md` を参照。本スキルはレビューせず List/Red フェーズの産出に専念。TDD サイクル中のレビューは `tdd` スキルの Refactor フェーズ（`coding-review` 経由）に一本化。

`tdd` スキルとの関係: `tdd` スキルの List/Red フェーズは常に本スキルへ委譲（`tdd` スキル手順1）。domain 判定と具象サブエージェントへの分岐は本スキル内部の責務。専用サブエージェントが無い domain も汎用サブエージェントへ委譲（in-context では実装しない）。
