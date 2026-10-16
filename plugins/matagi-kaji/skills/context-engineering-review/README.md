# context-engineering-review

スキル・サブエージェント定義・AGENTS.md/CLAUDE.md・プロンプトを `shared-rules/context-engineering/*` 照合、コンテキスト管理（有限な注意予算のキュレーション）観点レビューする入口スキル。

最小集合・構成（altitude/区切り）・実行時取得・長時間軸戦略・ツール効率観点で違反・逸脱を指摘。監査→`context-reviewer` エージェントへ委譲、修正必要→人の承認後 `context-engineer` エージェント（修正適用専用）へ適用委譲。レビュワーと産出者 別エージェント（`shared-rules/harness-engineering/review-independence-rule.md`）。人間向け概要=ここ、AI/ハーネス向け定義=`SKILL.md`。
