# agent

サブエージェント定義ファイル（`<role>.md`）置き場。

特定役割エージェント定義。**1エージェント＝1役割**：レビュワー（評価・指摘のみ）と産出者（実装／修正適用）は常に別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。

### レビュワー（評価・指摘のみ。修正は適用しない）

| エージェント | 役割 | 対の産出者 |
|------------|------|-----------|
| `prompt-reviewer` | prompt-* ルール照合 プロンプトレビュー | `prompt-engineer` |
| `context-reviewer` | context-engineering ルール照合 コンテキスト管理レビュー | `context-engineer` |
| `steering-reviewer` | selection-rule/harness-rule 照合 ステアリング構成レビュー | （産出者なし・指摘のみ） |

### 産出者（実装／承認後の修正適用のみ。自作物のレビューはしない）

| エージェント | 役割 |
|------------|------|
| `prompt-engineer` | prompt-* ルール照合 プロンプト修正適用 |
| `context-engineer` | context-engineering ルール照合 コンテキスト管理修正適用 |
