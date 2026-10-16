# agents テンプレート

複数スキル共有サブエージェントのひな形置き場。

## ここに置くもの

- 2つ以上のスキルから呼ばれるエージェント
- リポジトリ全体で再利用する汎用エージェント

## ここに置かないもの

- 特定スキル専用エージェント → `template/skills/agents/` に置く

## 使い方

`AGENT.md` コピー → `plugins/matagi/agents/<name>.md` に配置。

> 命名規則・フロントマター詳細: `shared-rules/naming-conventions/naming-rule.md`・
> `shared-rules/template/template-rule.md` 参照。