# ステアリング手法の選択ルール

## 原則

命令を Markdown に書くと決めたら、次に **どの手法で届けるか** を意図通りに選ぶ。
Claude Code 各手法は「読み込みタイミング・compaction 越し永続性・命令の強さ・コンテキストコスト」が異なる。**内容でなく "性質" で置き場所を決める。**

前段判断（コード強制か Markdown でよいか）は [[harness-rule]] に従う。本ルールは「Markdown／指示系の中でどれを使うか」を扱う。

## 手法ごとの意図と置き場所

| 書きたいもの | 使う手法 | 制約・注意 |
|------------|---------|-----------|
| プロジェクト事実・概要（ビルド、構成、規約、目標） | AGENTS.md / CLAUDE.md（ルート） | 200 行未満・オーナー明示。全チーム分を1ファイルに詰めない |
| 一部ディレクトリのみ有効な文脈 | サブディレクトリ AGENTS.md / CLAUDE.md | 当該ディレクトリのファイルに触れた時のみ読込 |
| 30 行超の手順（デプロイ・リリース・レビュー等） | skill（`.claude/skills/`） | AGENTS.md / CLAUDE.md に手順を書かない。呼出時のみ本体が載る |
| 一部ファイル群のみにかかる規約 | rule に `paths:` を付与 | 例 `paths: ["src/api/**"]`。未スコープにして全セッションで載せない |
| 組織・リポジトリ横断で常時効かせたい制約 | 未スコープの rule | compaction で再注入。数を絞る |
| 隔離したい副次タスク（検索・ログ解析・依存監査） | subagent | 中間結果でメイン会話を汚さない。最終メッセージのみ返る |
| 逆に、手順をメインで見せ操縦したい | skill（subagent にしない） | 可視性・ステアリング優先の場面 |

## 用語（委譲の種別）

- **スキル起動**：現行コンテキストで in-context 実行（上表「手順をメインで見せ操縦したい」に対応）。
- **エージェント委譲**：別コンテキストで隔離起動（上表「隔離したい副次タスク」に対応）。中間結果でメインコンテキストを汚さない。

2用語定義は本節を唯一の正とする。他ファイルは再掲せず `[[selection-rule]]` 参照（[[externalization-rule]]）。
| 個人の好み | ユーザーレベルのファイル | プロジェクト AGENTS.md / CLAUDE.md に個人設定を書かない |
| デフォルト振る舞い自体を変える | output styles | 慎重に。まず組み込み（Proactive/Explanatory/Learning）で足りるか確認 |
| その 1 回のみの標準・出力形式 | append-system-prompt | 短く保つ。既存指示と矛盾させない |

## 適用手順

1. [[harness-rule]] で「コードで強制すべきか」判定。強制 → hooks／settings.json へ（ここで終了）。
2. Markdown → 内容の *性質* 確認：**事実か／手順か／一部限定か／隔離したいか／個人的か**。
3. 上表で手法を1つ選ぶ。迷い → 「起動時に常に載せる必要があるか？」を問う、不要 → AGENTS.md / CLAUDE.md 以外（skill・path スコープ rule・subagent）へ寄せる。
4. AGENTS.md / CLAUDE.md 肥大化 → 手順は skill へ、限定的規約は path スコープ rule へ、個人設定はユーザーファイルへ移す。

## よくあるアンチパターン

- 「毎回 X したら必ず Y」を AGENTS.md / CLAUDE.md に書く → 決定的に効かせたいなら hooks（[[harness-rule]]）。
- 長い手順書を AGENTS.md / CLAUDE.md に貼る → skill へ。常時ロードでトークン消費。
- 全体に効かせたい訳ではない規約を未スコープ rule にする → `paths:` でスコープ。
- 副次的調査ログをメインで垂れ流す → subagent に隔離。

## 背景

`documents/reference/harness-engineering/steering-claude-code.md`（Anthropic 公式ブログ「Steering Claude Code」日本語まとめ）整理の 7 手法の意図 → 本リポジトリでスキル・ルール・AGENTS.md / CLAUDE.md を作る際の判断基準に落とし込んだもの。各手法の *挙動そのもの*（compaction 再注入・ネスト階層など）はリファレンス側。本ルールは *選び方* のみ持つ。

上表 rule／`paths:` = Claude Code の一般挙動。本 kit 自身の `rules/` は `.claude/rules/` 自動ロードでなく `[[link]]` 参照の md として運用。詳細: [[directory-rule]]（「本 kit での運用」）。

## 関連ルール

- [[harness-rule]] — コード vs Markdown 一次判定（破られたら困るか）
- [[externalization-rule]] — スキル・エージェント内のルール外部化
- [[structure-rule]] — ファイル配置・リポジトリ構造
- [[directory-rule]] — `rules/` 配置・命名・スコープ（本 kit 運用の注記あり）
- [[retrieval-rule]] — AGENTS.md / CLAUDE.md 事前投入 vs 実行時取得（JIT）使い分け
- [[long-horizon-rule]] — subagent をクリーン文脈の並列探索＋蒸留要約として使う長時間軸戦略
