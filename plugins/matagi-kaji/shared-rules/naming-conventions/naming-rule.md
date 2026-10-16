# スキル・エージェント命名規則

## スキル

### 名前の品詞・形（コンテンツの種類で使い分ける）

スキルは一律でない。コンテンツの種類で名詞形・動詞形が分かれる。

| タイプ | 品詞 | 判断基準 | 例 |
|--------|------|---------|-----|
| タスク（アクション）系 | **動詞・命令形** | 呼んで直接実行させるもの | `deploy`, `commit`, `fix-issue`, `summarize-changes` |
| 参照（知識）系 | **名詞句** | Claude が作業に適用する知識を渡すもの | `api-conventions`, `python-async-ops`, `legacy-system-context` |

**スキル名はコマンド名と揃える。** `/research` で呼ぶなら `research`、`/deploy` で呼ぶなら `deploy`。

直感的な見分け方:
- 「それを呼んで動かす」→ タスク系 → 動詞
- 「それが Claude に渡す知識のかたまり」→ 知識系 → 名詞句

> 品詞の使い分けは公式の強制でない。公式の例示パターン＋コミュニティのベストプラクティスから導かれる慣習。破っても動作はするが、description の精度と並んで Claude の自動起動の当たりやすさに影響。

### このリポジトリのスキル命名の優先方針

このリポジトリは、上記の汎用「動詞・命令形」原則より **対象ドメインを先頭に置いた名詞句** を優先。

- `ui-review` / `context-engineering-review` のように、ドメイン接頭辞（`ui-` / `context-` 等）を先頭に置く
- ドメインで関連スキルが辞書順に並び、責務のまとまりが一覧で見えることを重視
- ゆえに `review-ui-design`・`code-review-frontend` のような動詞先頭／接頭辞が後ろの形は採らない

> 命名候補の提案時は、まずこのドメイン接頭辞方針に沿った名詞句を第一候補とする。

### ディレクトリ名（= コマンド名）

ディレクトリ名がそのまま `/コマンド名` になる。`name:` フロントマターは一覧表示用ラベルにすぎない。

- **kebab-case 必須**（小文字・数字・ハイフンのみ）
- 具体的・記述的に（`helper`, `stuff`, `my-skill-v2` などは不可）
- マーケットプレイス配布前提なら kebab-case 必須（非準拠は弾かれる）

```
✅ commit-message-simple, create-skill, tdd
❌ tdd_expert, MySkill, commitMessageSimple
```

### SKILL.md フロントマター

必須フィールド:

```yaml
---
name: kebab-case-name       # ディレクトリ名と一致させる
description: >              # Claudeの自動起動トリガー。主要ユースケースを先頭に書く
  （説明文。description + when_to_use の合計が1,536文字に切り詰められるため要点を先頭に）
---
```

**`name` と `description` の役割分担:**

| フィールド | 用途 | 書き方 |
|-----------|------|--------|
| `name` | 人間が `/コマンド` で呼ぶラベル | kebab-case |
| `description` | Claude が自動委譲を判断するキー | トリガーキーワードを含む自然文 |

### 公開済みスキルのリネーム

マーケットプレイス配布後のリネームは事実上の破壊的変更（semver-major相当）。安易にリネームしない。

---

## エージェント（.claude/agents/*.md）

### 名前の品詞・形（役割名詞）

エージェントは「持続的な identity（役割）を持つ存在」。名前は**役割名詞（who/that does X）**にする。動詞（`review`, `debug`）でなく名詞化した形（`reviewer`, `debugger`）を使う。

実用的な接尾辞の型:

| 型 | 意味 | 例 |
|----|------|----|
| `-reviewer` / `-debugger` / `-analyst` | 動作主 | `code-reviewer`, `data-analyst` |
| `-expert` / `-specialist` | ドメイン専門家 | `docker-expert`, `security-specialist` |
| `-developer` / `-tester` / `-researcher` | 職能ロール | `api-developer`, `browser-tester` |

> スキルは「動詞（タスク）寄り」、エージェントは「役割名詞」。「それが作業して結果を返す存在」→ エージェント = 役割名詞、が判断の軸。

- ファイル名: **kebab-caseのロール名**

```
✅ code-reviewer, security-reviewer, docker-expert, browser-tester
❌ doCodeReview, helper, review（動詞のまま）
```

- **`description` が最重要**: 自動委譲は description の具体性で決まる。「どんなタスクか／何を返すか／いつ起動すべきか」を明確に書く
- ボディ（`---` 以降）は会話文でなく **職務記述書** スタイルで書く
- 組み込みエージェントのキーワードと衝突する汎用名に注意（`code-reviewer` などは Anthropic 側の定義済みルールを誘発し、システムプロンプトを上書きするリスクあり）

---

## 品詞・形のまとめ

| 種類 | 名前の形 | 例 |
|------|---------|-----|
| サブエージェント | 役割名詞（誰／何が〜する） | `code-reviewer`, `debugger`, `docker-expert` |
| スキル（タスク系） | 動詞・命令形 | `deploy`, `commit`, `fix-issue` |
| スキル（知識系） | 名詞句 | `api-conventions`, `python-async-ops` |

---

## フォルダ・ファイル全般

| 対象 | 規則 |
|------|------|
| スキルディレクトリ | kebab-case |
| ルールファイル | `kebab-case.md` |
| エージェントファイル | `kebab-case.md` |
| プラグイン名 | kebab-case |
