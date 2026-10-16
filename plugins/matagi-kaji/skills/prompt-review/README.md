# prompt-review

既存のプロンプト・スキル・サブエージェントの指示文を `shared-rules/prompt-engineering/*` に照らしてレビューする入口スキル。

構成要素・推論の足場・頑健性の観点で違反・逸脱を指摘。監査は `prompt-reviewer` エージェントへ委譲、修正が必要なら人の承認後に `prompt-engineer` エージェント（修正適用専用）へ適用を委譲。レビュワーと産出者は別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。人間向け概要はここ、AI/ハーネス向け定義は `SKILL.md`。
