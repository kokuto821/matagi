# determinism-review

ステアリング資産（スキル・サブエージェント・ルール・AGENTS.md/CLAUDE.md 等）のうち、プロンプトで書かれているが決定論的に判定できる処理を検出し、スクリプト化候補として指摘する入口スキル。

指摘のみで、スクリプト化の適用はしない。判断基準・言語優先順位 = `shared-rules/harness-engineering/determinism-rule.md`。サブエージェントへ委譲できる環境 → `determinism-reviewer` エージェントへ委譲。委譲できない環境（Claude Code 以外等）→ 本スキル内で直接レビュー。人間向け概要=ここ、AI/ハーネス向け定義=`SKILL.md`。
