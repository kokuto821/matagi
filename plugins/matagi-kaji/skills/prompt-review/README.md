# prompt-review

既存のプロンプト・スキル・サブエージェントの指示文を `shared-rules/prompt-engineering/*` 照合レビューする入口スキル。

構成要素・推論の足場・頑健性観点で違反・逸脱を指摘。監査→`prompt-reviewer` エージェントへ委譲、修正必要→人の承認後 `prompt-engineer` エージェント（修正適用専用）へ適用委譲。レビュワーと産出者 別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。人間向け概要=ここ、AI/ハーネス向け定義=`SKILL.md`。
