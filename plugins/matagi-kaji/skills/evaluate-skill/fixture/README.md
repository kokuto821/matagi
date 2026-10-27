# fixture

`evaluate-skill` の評価ケース用の架空スキル・エージェント置き場。実在のスキルと競合しない内容にしてある（「あいうえお」を出力するだけ）。

- `aiueo-skill/` = 評価ケース（`evals/`）ありの架空スキル
- `aiueo-no-evals-skill/` = 評価ケース無しの架空スキル
- `agents/aiueo-agent.md` = サブエージェント（評価対象外）の例

`skills/` 直下ではなくここに置くため、スキルとして読み込まれない。評価対象としてのみ使う。
