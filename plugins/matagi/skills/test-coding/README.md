# test-coding

TDD の List（テストリスト洗い出し）・Red（失敗するテストを書く）担当スキル。テスト観点洗い出し→テストケース設計後、対象コード分析→domain 判定。対応専門サブエージェント（`frontend-tester` / `backend-tester` 等）へ実装委譲する domain 非依存単一入口。

定義 = `SKILL.md`、テスト設計技法 = `shared-rules/test-design/test-design.md`、TDD List/Red フェーズの考え方 = `shared-rules/coding-conventions/tdd-rule.md`、domain 判定基準・委譲方針 = `shared-rules/coding-conventions/domain-classification-rule.md` 参照。本スキルはレビューせず List/Red フェーズ産出に専念。TDD サイクル中レビュー = `tdd` スキル Refactor フェーズ（`coding-review` 経由）に一本化。

`tdd` スキルとの関係: `tdd` スキル List/Red フェーズ = 常に本スキルへ委譲（`tdd` スキル手順1）。domain 判定・具象サブエージェントへの分岐 = 本スキル内部責務。専用サブエージェント無い domain も汎用サブエージェントへ委譲（in-context では実装しない）。
