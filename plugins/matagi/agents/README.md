# agent

サブエージェント定義ファイル（`<role>.md`）置き場。

特定役割エージェント定義。**1エージェント＝1役割**：レビュワー（評価・指摘のみ）・産出者（実装／修正適用）常に別エージェント分離（`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。

### レビュワー（評価・指摘のみ。修正は適用しない）

| エージェント | 役割 | 対の産出者 |
|------------|------|-----------|
| `frontend-code-reviewer` | フロントエンド コーディング規約準拠コードレビュー・監査（テスト除く） | `frontend-coder` エージェント |
| `backend-code-reviewer` | バックエンド コードレビュー・監査（backend専用規約は未整備のため design-rule・一般イディオム基準） | `backend-coder` エージェント |
| `frontend-test-reviewer` | フロントエンド テスト規約準拠 既存テストレビュー・監査 | `frontend-tester` エージェント |
| `backend-test-reviewer` | バックエンド 既存テストレビュー・監査（backend専用規約は未整備のため design-rule・一般作法基準） | `backend-tester` エージェント |
| `test-design-reviewer` | テスト技法準拠 テスト観点・ケース設計 抜け漏れレビュー | なし（TDD サイクルから呼ばれない。単独起動用残置） |
| `design-principles-reviewer` | design-rule（DRY/SRP/SoC等）準拠 設計原則レビュー（コード全般） | なし（単独起動用残置。`test-coding` から呼ばれない） |
| `ui-reviewer` | ui-design ルール準拠 UI 実装レビュー | `ui-designer` |

### 産出者（実装／承認後の修正適用のみ。自作物のレビューはしない）

| エージェント | 役割 |
|------------|------|
| `frontend-coder` | フロントエンド 本番コード実装（`coding-rule` 準拠。`coding` スキル frontend 判定時委譲） |
| `backend-coder` | バックエンド 本番コード実装（backend専用規約は未整備のため design-rule・一般イディオム基準。`coding` スキル backend 判定時委譲） |
| `frontend-tester` | フロントエンド テスト実装（`test-rule` 準拠。TDD サイクル統括 = `tdd` スキル） |
| `backend-tester` | バックエンド テスト実装（backend専用規約は未整備のため design-rule・一般作法基準） |
| `ui-designer` | ui-design ルール準拠 UI 実装 修正適用 |

> コード新規実装（産出）= domain 非依存入口スキル `coding` が domain 判定後 `frontend-coder` / `backend-coder` エージェントへ委譲。frontend/backend 以外 domain で専用サブエージェント無し → `coding` スキル自身フォールバック。

> ハーネス作成系（プロンプト・コンテキスト設計・ステアリング構成のレビュー/修正）エージェント（`prompt-reviewer` / `prompt-engineer` / `context-reviewer` / `context-engineer` / `steering-reviewer`）= `matagi-kaji` プラグイン `agents/` に分割済み。
