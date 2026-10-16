# agents テンプレート

複数スキルから共有するサブエージェントのひな形置き場。

## ここに置くもの

- 2つ以上のスキルから呼ばれるエージェント
- リポジトリ全体で再利用する汎用エージェント

## ここに置かないもの

- 特定スキル専用のエージェント → `template/skills/agents/` に置く

## 使い方

`AGENT.md` をコピーして `plugins/matagi/agents/<name>.md` に配置。

> 命名規則・フロントマターの詳細は `shared-rules/naming-conventions/naming-rule.md` と
> `shared-rules/template/template-rule.md` を参照。