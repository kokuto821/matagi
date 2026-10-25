# 評価結果の出力先と要約書式

evaluate-skill 手順3・6が従う規約。値の唯一の正 = 本ファイル。SKILL.md に再掲しない。

## 出力先の決め方

上から順に評価し、最初に該当したものを使う。

1. ユーザーが場所を自発的に指定した → それを採用（設定が不正でも指定が優先）
2. 設定に `evalOutputDir` あり → 確認せず採用
3. 設定が不正 → 理由を伝えて中断
4. 設定なし → 既定 `eval-result/` を示して確認。ユーザーが別の場所を答えたらそれを採用

確定後、`plugins/` 配下なら保存せず指摘して別の場所を求め、再度この順で決める。

- 設定ファイル = `.claude/matagi-kaji-settings.json`（リポジトリルート基準）。キー `evalOutputDir` = リポジトリルート基準の相対パス or 絶対パス。
- 不正 = 次のいずれか。既定へ黙って落とさない。
  - 構文エラーの JSON
  - `evalOutputDir` が空文字 or 文字列以外
- ファイルなし・キーなし = 設定なし扱い。
- 絶対パス・リポジトリ外パス = 許容。
- `plugins/` 配下 = 設定・ユーザー指定を問わず拒否（配布物のため）。
- 既定 = リポジトリルートの `eval-result/`。

## 配置

```
<出力先>/
├── .gitignore                     ← `iterations/` を無視。無ければ作る
├── <skill>.md                     ← 要約。コミット対象
└── iterations/                    ← git 管理外
    └── <skill>/
        └── iteration-N/
            ├── eval-<ID>/         ← eval の生出力（skill-creator 形式）
            └── trigger/           ← trigger 評価の生出力（eval セット・レビュー HTML・最適化 JSON）
```

- 利用側ルートの `.gitignore` は触らない。
- N = 評価実行ごとに採番。`iterations/<skill>/` の既存最大値 + 1。eval と trigger を同じ実行で行えば同じ N。
- skill-creator の既定出力先（`<skill>-workspace/`・`/tmp`）は使わない。
- 生成物ディレクトリ（`eval-result/` 等）は [[readme-rule]]（matagi/shared-rules/readme-convention/readme-rule.md）の README 必須の対象外。evaluate-skill は README を作らない。

## 要約 md の書式

3部構成。

### 1. 共通ヘッダ（実行のたび更新）

- 対象スキルと評価日
- 改善案（未反映の旨を明記）
- 生出力へのパス

### 2. 最新の結果

種類別の小節に分ける。**実行した種類の小節だけ上書き**。実行しなかった種類は前回の内容を残す。各小節に評価日と iteration N を明記。

- eval・ベンチマーク小節: スキルあり・なし比較の合格率、ベンチマーク要約
- trigger 小節: 発火率

### 3. 履歴

表。評価実行ごとに種類別の行を1行ずつ追記。上書きしない。

| 列 | 内容 |
|----|------|
| 日付 | 評価日 |
| iteration | N |
| 種類 | eval / trigger |
| 主要数値 | 合格率 / 発火率 |
| 備考 | 任意 |

## 書き手

要約 md の書き手 = evaluate-skill 本体（手順6）。評価対象スキルのファイル編集禁止の対象外（[[skill-roles-rule]]）。
