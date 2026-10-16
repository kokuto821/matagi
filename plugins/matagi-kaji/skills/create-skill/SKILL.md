---
name: create-skill
description: >
  スキルまたはサブエージェントを新規作成する。命名規則・テンプレート・配置ルールに
  従ってファイルを生成する。
  「スキルを作りたい」「エージェントを追加したい」「SKILL.md を作って」と言ったとき
  に起動する。
---

# create-skill

## 概要

このリポジトリのルール（命名規則・配置先・テンプレート）に沿って、スキルまたは
サブエージェントのファイルを対話的に生成する。

## 参照するルール・テンプレート

| 用途 | パス |
|------|------|
| 命名規則 | `shared-rules/naming-conventions/naming-rule.md` |
| 配置ルール | `shared-rules/repository-structure/structure-rule.md` |
| テンプレートルール | `shared-rules/template/template-rule.md` |
| ルール外部化原則 | `shared-rules/rule-externalization/externalization-rule.md` |
| ハーネス制御の媒体選択 | `shared-rules/harness-engineering/harness-rule.md` |
| プロンプト構成要素 | `shared-rules/prompt-engineering/composition-rule.md` |
| 推論の足場の要否 | `shared-rules/prompt-engineering/scaffolding-rule.md` |
| プロンプト頑健性・安全性 | `shared-rules/prompt-engineering/robustness-rule.md` |
| レビュー重大度の共通定義（レビュー系のみ） | `matagi/shared-rules/review-severity/severity-rule.md` |
| スキルテンプレート | `template/skills/SKILL.md` |
| エージェントテンプレート | `template/agents/AGENT.md` |

## 手順

```mermaid
flowchart TD
    START(["START"])
    END(["END"])

    subgraph L1["1 種別と目的を確認する"]
        S1a["発言から種別 名前候補 目的を読み取る"]
        S1b{"不明な点があるか？"}
        S1c["ユーザーに質問する"]
        S1a --> S1b
        S1b -->|YES| S1c
        S1c --> S1a
    end

    subgraph L2["2 名前を命名規則に照らして確定する"]
        S2a{"候補が命名規則に合っているか？"}
        S2b["修正案を提示してユーザーに確認する"]
        S2a -->|NO| S2b
    end

    subgraph L3["3 配置先を決定する"]
        S3a{"種別はスキルか？"}
        S3b["スキルの配置先表に従い配置する"]
        S3c["サブエージェントの配置先表に従い配置する"]
        S3a -->|YES| S3b
        S3a -->|NO| S3c
    end

    subgraph L4["4 内包するルールを外部化できるか確認する"]
        S4a{"他のスキル・エージェントにも適用できる または 常に従うべき不変のガイドラインか？"}
        S4b["先に rules 配下にルールファイルを作成し パスで参照する"]
        S4c["スキル固有の手順・実行ロジックとしてインラインのまま書く"]
        S4d{"付随する制御処理に 破られたら困るものがあるか？"}
        S4e["コードで書く"]
        S4f["Markdown で書く"]
        S4a -->|YES| S4b
        S4a -->|NO| S4c
        S4b --> S4d
        S4c --> S4d
        S4d -->|YES| S4e
        S4d -->|NO| S4f
    end

    subgraph L5["5 テンプレートを読み込んでドラフトを作成する"]
        S5a{"種別はスキルか？"}
        S5b["template/skills/SKILL.md を読み込み フロントマターと本文構成を埋める"]
        S5c["template/agents/AGENT.md を読み込み フロントマターと本文を埋める"]
        S5d["composition-rule で構成要素の過不足を確認する"]
        S5e{"多段の判断を含むか？"}
        S5f["scaffolding-rule に従い推論の足場を組み込む"]
        S5a -->|YES| S5b
        S5a -->|NO| S5c
        S5b --> S5d
        S5c --> S5d
        S5d --> S5e
        S5e -->|YES| S5f
    end

    subgraph L6["6 ドラフトをユーザーに提示して確認を取る"]
        S6a["ドラフト全文を提示し 名前 配置先 トリガー語 手順 出力を確認する"]
        S6b{"承認されたか？"}
        S6c["修正を反映する"]
        S6a --> S6b
        S6b -->|NO| S6c
        S6c --> S6a
    end

    subgraph L7["7 ファイルを書き込む"]
        S7a["Write ツールでファイルを作成する"]
    end

    subgraph L8["8 後続作業を案内する"]
        S8a{"種別はスキルか？"}
        S8b["skills 配下に配置済みで Claude Code の再起動で反映される旨を案内する"]
        S8c["agents 配下に配置済みで Claude Code の再起動で反映される旨を案内する"]
        S8a -->|YES| S8b
        S8a -->|NO| S8c
    end

    START --> S1a
    S1b -->|NO| S2a
    S2a -->|YES| S3a
    S2b --> S3a
    S3b --> S4a
    S3c --> S4a
    S4e --> S5a
    S4f --> S5a
    S5e -->|NO| S6a
    S5f --> S6a
    S6b -->|YES| S7a
    S7a --> S8a
    S8b --> END
    S8c --> END

    classDef user fill:#fff3bf,stroke:#f08c00,color:#000
    class S1c,S2b,S6b user
```

遷移は図に従い、判定基準・詳細は下の本文に従う。

凡例: 黄 = ユーザーの確認・承認

### 1. 種別と目的を確認する

ユーザーの発言から以下を読み取る。不明な場合は質問する。

- **種別**: スキル or サブエージェント
- **名前（候補）**: ユーザーが挙げた名前、または目的から導出する
- **目的**: 何をするか（1〜2行）

### 2. 名前を命名規則に照らして確定する

`shared-rules/naming-conventions/naming-rule.md` のルールに従う。

| 種別 | 形 | 例 |
|------|----|----|
| スキル（タスク系） | 動詞・命令形 | `deploy`, `create-skill` |
| スキル（知識系） | 名詞句 | `api-conventions` |
| サブエージェント | 役割名詞 | `code-reviewer`, `docker-expert` |

- kebab-case 必須
- `helper`, `stuff`, `my-skill-v2` などは不可
- ユーザーの候補が規則に合わない場合は修正案を提示してから確認する

### 3. 配置先を決定する

`shared-rules/repository-structure/structure-rule.md` に従う。

| 種別 | 配置先 |
|------|--------|
| スキル | `plugins/matagi/skills/<name>/SKILL.md` |
| サブエージェント | `plugins/matagi/agents/<name>.md` |

### 4. 内包するルールを外部化できるか確認する

`shared-rules/rule-externalization/externalization-rule.md` に従い、スキル・エージェントに書こうとしているルール・制約・判断基準が `rules/` に切り出せるものかを判断する。

- **切り出す**: 他のスキル・エージェントにも適用できる、または「常に従うべき不変のガイドライン」の性質を持つもの
- **インラインのまま**: そのスキル固有の手順・実行ロジック

切り出す場合は先に `rules/<topic>/` にルールファイルを作成し、スキル・エージェントからはパスで参照する。

また、`shared-rules/harness-engineering/harness-rule.md` に従い、スキルに付随する自動化・制御処理の媒体を判断する。

- **コード（`.sh` / `.ts` / `.js`）**: 「破られたら困る」制御（パーミッション、フック実行ロジック、リトライ）
- **Markdown（`.md`）**: モデルへのソフトな指針（方針、規約、トーン）

### 5. テンプレートを読み込んでドラフトを作成する

#### スキルの場合

`template/skills/SKILL.md` を読み込み、以下を埋める。

```yaml
---
name: <確定した名前>
description: >
  <ユーザーが自然に言う言葉（トリガー語）を先頭に。要点を先頭に>
# when_to_use: （任意）
# allowed-tools: （任意）
# disable-model-invocation: true  （副作用ありのタスク型を手動起動のみにしたい場合）
---
```

本文構成（概要／ルール／手順／出力・500行未満）と手順の記述形式（mermaid `flowchart TD`）は [[template-rule]] (`shared-rules/template/template-rule.md`) を唯一の出典とする。テンプレートの構成をそのまま埋め、構成を独自に定義し直さない。Step 4 で外部化したルールがあれば `## ルール` 節に参照を記載し、無ければ節ごと削除する。

description・手順・出力など指示文を書くときは、[[composition-rule]] (`shared-rules/prompt-engineering/composition-rule.md`) の構成要素が揃っているかを確認する。多段の判断を含むスキル・エージェントには [[scaffolding-rule]] (`shared-rules/prompt-engineering/scaffolding-rule.md`) に従って推論の足場を組み込む（単純タスクには足さない）。

#### サブエージェントの場合

`template/agents/AGENT.md` を読み込み、以下を埋める。

```yaml
---
name: <確定した名前>
description: <委譲条件を具体的に。いつ・何を・どう返すかを明示>
# tools: （任意。省略で全ツール継承）
# model: （任意。haiku でコスト最適化など）
---
```

本文は「役割宣言 → 手順 → チェックリスト/観点 → 出力フォーマット」の職務記述書スタイル。手順の記述形式（mermaid `flowchart TD`）は [[template-rule]] を唯一の出典とする。

### 6. ドラフトをユーザーに提示して確認を取る

作成予定のファイル内容を全文提示し、以下を確認する。

- 名前・配置先は正しいか
- description のトリガー語は自然か
- 手順・出力フォーマットは意図通りか

修正があれば反映してから再提示する。

### 7. ファイルを書き込む

承認を得たら Write ツールでファイルを作成する。

### 8. 後続作業を案内する

**スキルを作成した場合:**

```
skills/ 配下に配置済みです。Claude Code を再起動すると反映されます。
```

**サブエージェントを作成した場合:**

```
agents/ 配下に配置済みです。Claude Code を再起動すると反映されます。
```

## 出力

- 確認フェーズ: ドラフト全文（フロントマター＋本文）
- 完了フェーズ: 作成したファイルのパスと後続手順
