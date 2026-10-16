# OpenSpec 統合ルール

## 原則

**OpenSpec =「大規模変更の合意形成」のみ担う。実装 = 既存産出 skill、レビュー = 既存レビュー skill にそのまま委ねる。** OpenSpec 自体が実装・レビューを兼ねることはない。OpenSpec = steering 手法（[[selection-rule]] 扱う AGENTS.md/CLAUDE.md/rules/skills/subagents 等）の一つでなく、外部 CLI ツール。両者レイヤー異なるため、OpenSpec 役割分担 = [[selection-rule]] に追記せず本ルールに独立して置く。

## 判断基準

### いつ OpenSpec の propose を使うか

| 状況（該当する具体的シグナル） | どうする |
|------|---------|
| 実装方針候補が複数で比較・トレードオフ整理必要／設計判断やり直しが高コスト（後戻りしにくい）／複数 capability（`openspec/specs/` 配下）にまたがる | [[openspec-workflow]]（`skills/openspec-workflow/SKILL.md`）で進める |
| 実装方針が一択で、対話中に完了条件がその場で1〜3行にまとまる | 使わない。従来どおり `github-issue-resolve` の PLAN フェーズで進める |
| 何から手をつけるか自体が固まっていない | 先に [[openspec-workflow]] の explore フェーズで壁打ち→判断 |

`openspec/` 未導入の場合 = 先に [[openspec-setup]]（`skills/openspec-setup/SKILL.md`）で導入（§導入 参照）。

境界例: 変更自体は小規模でも、既存振る舞いを変える破壊的変更のように後戻りコスト高い場合 = `propose` を使う。

issue 化すべきか判断（issue 粒度）自体 = [[issue-driven-rule]] の基準に従う。本ルールが扱う = 「issue 化後、その PLAN フェーズで OpenSpec を使うか」という一段下の判断。

### 導入

作業ディレクトリごと [[openspec-setup]]（`skills/openspec-setup/SKILL.md`）で導入。matagi をマーケットプレイスプラグインとして導入したどの作業リポジトリでも同手順で再現できるよう、`openspec/config.yaml` やフォークしたスキーマ本体（作業リポジトリごとのローカルファイル）ではなく、**この kit 側のスキルとして**導入手順を保持（詳細 背景節）。

`openspec-setup` が `openspec/config.yaml` とフォークしたスキーマのテンプレートに埋め込むポインタ = 以下を**唯一の正**とする（`openspec-setup` 側に内容を再掲せず、本表を参照させる）。

| 埋め込み先 | 内容 |
|---|---|
| `config.yaml` の `context` | この作業ディレクトリの規約は matagi のルール（`plugins/matagi/shared-rules/`）を参照し、矛盾しないこと |
| `config.yaml` の `rules.proposal` | 対象 issue 番号を明記すること（[[issue-driven-rule]]） |
| `config.yaml` の `rules.design` | [[design-rule]] の観点で代替案と比較すること |
| `config.yaml` の `rules.tasks` | 各タスクの実装委譲先（tdd/coding/test-coding）を明記すること |
| `config.yaml` の `operations.apply.guidance` | [[openspec-workflow]] スキル経由で進める旨、既存の産出 skill へ委譲する旨 |
| `config.yaml` の `operations.archive.guidance` | archive 前に [[review-independence-rule]] に従ったレビューを済ませる旨 |
| `templates/proposal.md`（HTML コメント） | 対象 issue 番号の明記を促すポインタ（[[issue-driven-rule]]）、[[openspec-workflow]] への参照 |
| `templates/design.md`（HTML コメント） | [[design-rule]]・[[review-independence-rule]] への参照 |
| `templates/tasks.md`（HTML コメント） | 各タスクの実装は [[openspec-workflow]] スキル経由で進める旨の参照 |

いずれも参照ポインタのみ、ルール本文コピーしない（[[externalization-rule]] §単一情報源）。

### OpenSpec フェーズと既存フェーズ・skill の対応

| OpenSpec フェーズ | 実行手段 | 対応する既存フェーズ・skill |
|---|---|---|
| `explore`（任意） | CLI 生成 `openspec-explore` スキルをそのまま使う（コードを書かないため委譲問題なし） | PLAN フェーズ壁打ちの代替・補助 |
| `propose` | CLI 生成 `openspec-propose`/`openspec-update-change` スキルをそのまま使う（同上） | PLAN フェーズ合意形成手段。proposal/design/specs delta/tasks.md 生成 |
| `apply` | **[[openspec-workflow]] スキル経由。CLI 生成 `openspec-apply-change` は直接使わない**（実装コードを自分で書き、既存委譲表を無視するため） | IMPLEMENT フェーズの上位ループにすぎない。tasks.md 各項目 = 既存委譲表（[[github-issue-resolve]] 手順4: テストを伴う実装は [[tdd]]、伴わない実装は [[coding]]、テストのみは [[test-coding]] 等）にそのまま従って実装。**OpenSpec 自身はコードを書かない**。 |
| `archive` / `sync-specs` | **[[openspec-workflow]] スキル経由**（レビューゲートを通してから CLI 生成 `openspec-archive-change`/`openspec-sync-specs` を起動） | REVIEW〜COMMIT フェーズ内、または PR 作成前に実施、`openspec/specs/` 確定 |

### レビュー独立性

**`apply` 実行後レビュー = `propose`/`apply` を行った本人（同一エージェント）が兼ねない。** 既存 `coding-review`（実装コード）または `ai-engineering-review`（md 資産）に必ず委譲。[[review-independence-rule]] の帰結で、OpenSpec 専用の新メカニズム追加ではない。`archive` = レビュー完了後に実行。

**この保証 = 散文のみに頼らない。** [[openspec-workflow]] が CLI 生成 `openspec-apply-change`/`openspec-archive-change` を起動しない、という記述だけでは、これら2スキル自身の `description` によるユーザー発話からの直接自動起動（[[openspec-workflow]] を経由しないルーティング）を防げない。よって [[openspec-setup]] が導入時 `.claude/settings.json` の `permissions.deny` へ `Skill(openspec-apply-change *)`・`Skill(openspec-archive-change *)` を追加、これら2スキルの直接起動そのものを技術的ブロック（[[harness-rule]] の「破られたら困るか」判定に基づく）。

### `openspec/specs/` と `rules/`・`shared-rules/` の関係

観点異なるため二重管理ではない。

- `openspec/specs/`: **これから作る／変えていく機能の仕様**（何を作るか。observable behavior の契約）
- `plugins/matagi/shared-rules/`: **Claude がどう振る舞うか**（steering。この kit 自身の規約）

既存コードの後追いスペック化はしない。これから変更する部分のみ段階的に `openspec/specs/` へ落とす方針。

## やってはいけないこと

- 対話ですぐ合意できる小規模変更にまで OpenSpec の `propose` を持ち込み、フェーズを重くする。
- `apply` フェーズ中に、既存委譲表を経由せず本ワークフロー自身が実装コードを書く。
- `apply` 実行者本人がレビューを兼ね、そのまま `archive` まで進める。
- CLI 生成 `openspec-apply-change`/`openspec-archive-change` を直接起動。委譲もレビューゲートも無いため、必ず [[openspec-workflow]] 経由。
- `openspec/config.yaml` の `context` / `rules` や、`openspec/schemas/*/templates/*.md` に、この kit のルール本文をコピー（参照ポインタのみ埋め込む。[[externalization-rule]] §単一情報源）。
- OpenSpec のフェーズ・スキーマの扱いを [[selection-rule]] に追記（steering 手法の選択基準と主旨が異なるため、本ルールに独立）。

## 背景

issue #13。当初 matagi 自身のリポジトリでの利用のみ想定だったが、実際の用途 =「マーケットプレイスプラグインとして導入した別の作業リポジトリで OpenSpec を使う」こと。よって repo-local ファイルへのポインタ直書きから、プラグイン配布の**スキル**（[[openspec-setup]]・[[openspec-workflow]]）が導入・進行ロジックを持つ方式へ転換。転換根拠（`openspec schema fork`/`openspec store` 制約の実機検証結果）= 事実であり、本ルールには書かず [[openspec-overview]] 参照。

OpenSpec の事実（`openspec init` の実際の挙動、コマンド一覧、config.yaml のフィールド等）= 本ルールに書かず、[[openspec-overview]]（`documents/reference/spec-driven-development/openspec-overview.md`）参照。

## 関連ルール

- [[issue-driven-rule]]（`shared-rules/issue-driven-development/issue-driven-rule.md`） — issue 化判断・粒度・ブランチ運用
- [[design-rule]]（`shared-rules/design-principles/design-rule.md`） — design.md で比較する設計原則
- [[openspec-setup]]（`skills/openspec-setup/SKILL.md`） — 作業ディレクトリへの導入
- [[openspec-workflow]]（`skills/openspec-workflow/SKILL.md`） — フェーズ進行・実装委譲・レビューゲート
- [[github-issue-resolve]]（`skills/github-issue-resolve/SKILL.md`） — apply の実装委譲基準（IMPLEMENT 表）
- [[openspec-overview]]（`documents/reference/spec-driven-development/openspec-overview.md`） — OpenSpec 自体の事実整理
