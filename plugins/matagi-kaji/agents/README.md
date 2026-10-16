# agent

サブエージェントの定義ファイル（`<role>.md`）の置き場。

特定の役割を持つエージェントを定義。**1エージェント＝1役割**：レビュワー（評価・指摘のみ）と産出者（実装／修正適用）は常に別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。

### レビュワー（評価・指摘のみ。修正は適用しない）

| エージェント | 役割 | 対の産出者 |
|------------|------|-----------|
| `prompt-reviewer` | prompt-* ルールに照らしたプロンプトのレビュー | `prompt-engineer` |
| `context-reviewer` | context-engineering ルールに照らしたコンテキスト管理のレビュー | `context-engineer` |
| `steering-reviewer` | selection-rule/harness-rule に照らしたステアリング構成のレビュー | （産出者なし・指摘のみ） |

### 産出者（実装／承認後の修正適用のみ。自作物のレビューはしない）

| エージェント | 役割 |
|------------|------|
| `prompt-engineer` | prompt-* ルールに照らしたプロンプトの修正適用 |
| `context-engineer` | context-engineering ルールに照らしたコンテキスト管理の修正適用 |
