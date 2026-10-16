# 推論の足場（reasoning scaffolding）のルール

スキル・サブエージェント・プロンプトへ 段階的推論・問題分解・自己検証を**組み込むかどうか**の判断基準。

出典: `documents/reference/prompt-engineering/the-prompt-report.md`（§2.2.2 Thought Generation / §2.2.3 Decomposition / §2.2.5 Self-Criticism / §6.1 Benchmarking）、`documents/reference/prompt-engineering/prompt-pattern-catalog.md`（Cognitive Verifier / Reflection / Fact Check List）。

## 原則

複雑な判断・多段階処理を要するタスク → 推論足場を明示的に組み込む。ただし**単純タスクには組み込まない** — 足場は無料でなく、簡単な問題ではむしろ精度を下げうる。

## 最重要の歯止め：単純タスクに CoT を足さない

The Prompt Report §6.1 ベンチマーク: Zero-Shot に「順を追って考えよう」を素朴に足した Zero-Shot-CoT が**Zero-Shot より大きく性能を落とした**。「段階的に考えて」を常につければ良いわけではない。

- タスク難易度・多段性を先に見積もる。1〜2 ステップで答えが出るものに足場は不要。
- 足場を入れるなら、汎用「step by step」よりタスクに沿った具体的検討軸（例: 「ジャンル・筋書き・スタイルを順に評価せよ」）を与えるほうが効く。

## 足場の3系統と使いどころ

| 系統 | 手法の例 | 組み込む場面 |
|------|---------|------------|
| **段階的推論（Thought Generation）** | CoT / 検討軸の列挙 | 中間推論なしだと誤りやすい多段判断 |
| **問題分解（Decomposition）** | Least-to-Most / Plan-and-Solve / サブ質問化 | 大タスクをサブ問題に割れる場合。先に計画→逐次実行 |
| **自己検証（Self-Criticism）** | Self-Refine / Chain-of-Verification / Fact Check List | 事実性・正確性が重要、誤り検出が価値を生む場合 |

## 適用の指針

- **多段判断** → まず検討軸を列挙させる／サブ問題に分解させる。
- **事実性が重要** → 出力が依拠する事実を列挙させる（Fact Check List）、または生成→検証質問→改訂（CoVe）を組む。ただし検証が意味を持つ出力型に限る。
- **自己検証は停止条件を決める**: Self-Refine 型「生成→批評→改善」は無限ループしうる。反復回数か停止条件を明示。
- **質問細分化はやりすぎない**: サブ質問を固定数で切る → 重要観点を取りこぼす。数を欲張らない。
- サブエージェント設計: 足場を「エージェント内部手順」として書く（呼出側プロンプトを汚さない）。

## 関連ルール

- [[composition-rule]] — 指示・出力形式など足場前提の構成要素
- [[improvement-rule]] — 既存プロンプトへ足場を後付け改善する際の原則
- [[robustness-rule]] — 自己検証と表裏の過信・追従（sycophancy）対処
