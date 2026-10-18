# prompt-engineering ルール索引

プロンプト・スキル・サブエージェント指示文の設計／レビュー／改善ルール群の**索引（ルーター）**。
全部は読み込まない。**まず本索引を読み、扱う関心事に該当するルールだけ読む**運用。

対象: Claude Code のプロンプト・SKILL.md・エージェント定義。新規作成時、
レビュー時（`prompt-review` スキル / `prompt-engineer` エージェント）、改善時の判断基準を定める。

## 全体構成

```
prompt-engineering/
├── composition-rule.md    ← プロンプトの構成要素が揃っているか
├── scaffolding-rule.md    ← 推論の足場（分解・自己検証）の要否
├── robustness-rule.md     ← 頑健性・安全性（敏感さ・過信・値の再掲・外部入力）
└── improvement-rule.md    ← 既存プロンプトの改善の進め方
```

対象は**プロンプト本文品質**（構成・足場・頑健性・改善）に限る。表現手法の選択
（AGENTS.md/CLAUDE.md/rules/skills/subagents 等）は `shared-rules/harness-engineering/selection-rule.md` 参照。

## 利用ガイド（いつどれを読むか）

| 関心事 | ルール |
|--------|--------|
| 指示・出力形式・例示・役割・文脈の過不足確認したい | `composition-rule.md` |
| 難タスクに推論足場を組むか／単純タスクにCoTを足していないか判断したい | `scaffolding-rule.md` |
| フォーマット一貫性・値再掲ドリフト・追従/過信・外部入力扱いを点検したい | `robustness-rule.md` |
| 既存プロンプトを診断ベースで的を絞り改善したい | `improvement-rule.md` |

各ルールは `[[composition-rule]]` のように `[[wikilink]]` 相互参照（記法定義: [[directory-rule]]（`shared-rules/rules-directory/directory-rule.md`）「相互リンク記法」）。
