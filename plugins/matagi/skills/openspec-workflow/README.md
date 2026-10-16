# openspec-workflow

OpenSpec の explore/propose/apply/archive フェーズを統括するオーケストレータースキルの置き場。

CLI 生成の `openspec-apply-change`/`openspec-archive-change` は実装委譲・レビューゲートを持たない。apply/archive では起動せず、本スキルが `openspec` CLI を直接使って進行・委譲・レビューを担う。
