# スキル評価ルール

## 原則

**スキル作成 = `create-skill`、評価 = `evaluate-skill`。役割重複禁止。** 評価 = skill-creator の評価機能を借用、評価ロジックの自作禁止。

## 判断基準

### 役割分担

| 作業 | 担当 |
|------|------|
| スキル新規作成（命名・配置・テンプレート・ルール外部化） | `create-skill` |
| eval 実行・ベンチマーク・description の trigger 評価 | `evaluate-skill`（skill-creator の評価節を呼ぶ） |
| description・本文の書き換え | `create-skill` 側。人が承認して実施 |
| skill-creator の作成・改善の節 | 使用禁止（`create-skill` と競合） |

`evaluate-skill` = 測定と改善案提示で停止。改善案の反映は自ら行わない。

### 評価ケースの置き場所

- 対象スキル直下 `skills/<name>/evals/`。スキルと同時更新のため。
- `evals/evals.json` = eval 実行用。スキーマの正 = skill-creator の `references/schemas.md`（再掲しない）。
- `evals/trigger-evals.json` = trigger 評価用。形式 = skill-creator「Description Optimization」節 Step 1 のとおり。ファイル名 = 本リポジトリ独自の取り決め。
- `evals/` にも `README.md` 必須（[[readme-rule]]）。

### 評価ケースの書き手

**書き手 = 評価対象スキルの産出者と別エージェント。** 産出者が自作の試験を書く→通る前提のケースになる（[[review-independence-rule]] と同趣旨）。

| 状況 | どうする |
|------|---------|
| ケース未作成 | 産出者と別エージェントが起草、ユーザーが確認 |
| 産出者自身が書いたケースのみ | 実行前にユーザーへ伝達、別エージェントの見直しを促す |

### 評価結果・一時ファイルの置き場所

skill-creator 既定 = スキル隣の `<skill-name>-workspace/` と `/tmp`。**git 管理外（スクラッチパッド等）へ出力先を指定。** `plugins/` 配下への結果残置禁止。

### 対象外

- サブエージェント（skill-creator が評価非対応）
- 評価の必須化（任意の手動起動のみ。必須化の範囲 = 運用後に別途判断）

## やってはいけないこと

- skill-creator の評価ロジックを本リポジトリへコピー・改変して持ち込む（[[content-fidelity-rule]]）
- `evaluate-skill` から description・本文を書き換える
- 評価結果を `plugins/` 配下へ残す

## 背景

issue #93。skill-creator = 作成・改善・評価を一体化、そのまま導入→`create-skill` と役割重複。評価節のみ借用する形に絞り競合回避。

## 関連ルール

- [[review-independence-rule]] — 産出者と評価者を分ける原則
- [[content-fidelity-rule]] — 原典改変禁止
- [[readme-rule]] — 全ディレクトリに README 必須
