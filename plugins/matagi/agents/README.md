# agent

サブエージェント定義ファイル（`<role>.md`）の置き場。

特定役割のエージェントを定義する。**1エージェント＝1役割**：レビュワー（評価・指摘のみ）と産出者（実装／修正適用）は常に別エージェントに分離（`matagi-kaji/shared-rules/harness-engineering/review-independence-rule.md`）。

### レビュワー（評価・指摘のみ。修正は適用しない）

| エージェント | 役割 | 対の産出者 |
|------------|------|-----------|
| `frontend-code-reviewer` | フロントエンドのコーディング規約準拠のコードレビュー・監査（テスト除く） | `frontend-coder` エージェント |
| `backend-code-reviewer` | バックエンドのコードレビュー・監査（backend専用規約未整備のため design-rule・一般イディオム基準） | `backend-coder` エージェント |
| `frontend-test-reviewer` | フロントエンドのテスト規約準拠の既存テストレビュー・監査 | `frontend-tester` エージェント |
| `backend-test-reviewer` | バックエンドの既存テストレビュー・監査（backend専用規約未整備のため design-rule・一般作法基準） | `backend-tester` エージェント |
| `test-design-reviewer` | テスト技法準拠のテスト観点・ケース設計の抜け漏れレビュー | なし（TDD サイクルから呼ばれない。単独起動用に残置） |
| `design-principles-reviewer` | design-rule（DRY/SRP/SoC等）準拠の設計原則レビュー（コード全般） | なし（単独起動用に残置。`test-coding` から呼ばれない） |
| `ui-reviewer` | ui-design ルール準拠の UI 実装レビュー | `ui-designer` |

### 産出者（実装／承認後の修正適用のみ。自作物のレビューはしない）

| エージェント | 役割 |
|------------|------|
| `frontend-coder` | フロントエンドの本番コード実装（`coding-rule` 準拠。`coding` スキルが frontend 判定時に委譲） |
| `backend-coder` | バックエンドの本番コード実装（backend専用規約未整備のため design-rule・一般イディオム基準。`coding` スキルが backend 判定時に委譲） |
| `frontend-tester` | フロントエンドのテスト実装（`test-rule` 準拠。TDD サイクル統括は `tdd` スキル） |
| `backend-tester` | バックエンドのテスト実装（backend専用規約未整備のため design-rule・一般作法基準） |
| `ui-designer` | ui-design ルール準拠の UI 実装の修正適用 |

> コード新規実装（産出）は、domain 非依存の入口スキル `coding` が domain 判定後に `frontend-coder` / `backend-coder` エージェントへ委譲。frontend/backend 以外の domain で専用サブエージェントが無い場合、`coding` スキル自身がフォールバック。

> ハーネス作成系（プロンプト・コンテキスト設計・ステアリング構成のレビュー/修正）のエージェント（`prompt-reviewer` / `prompt-engineer` / `context-reviewer` / `context-engineer` / `steering-reviewer`）は `matagi-kaji` プラグインの `agents/` に分割済み。
