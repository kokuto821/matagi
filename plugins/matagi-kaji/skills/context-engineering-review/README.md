# context-engineering-review

スキル・サブエージェント定義・AGENTS.md/CLAUDE.md・プロンプトを `shared-rules/context-engineering/*` に照らして、コンテキスト管理（有限な注意予算のキュレーション）の観点でレビューする入口スキル。

最小集合・構成（altitude/区切り）・実行時取得・長時間軸戦略・ツール効率の観点で違反・逸脱を指摘。監査は `context-reviewer` エージェントへ委譲、修正が必要なら人の承認後に `context-engineer` エージェント（修正適用専用）へ適用を委譲。レビュワーと産出者は別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。人間向け概要はここ、AI/ハーネス向け定義は `SKILL.md`。
