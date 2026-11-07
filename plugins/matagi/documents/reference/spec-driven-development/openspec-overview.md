# OpenSpec 概要（事実整理）

`@fission-ai/openspec`（[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)）の挙動を、公式ドキュメント調査と本リポジトリでの実行結果に基づいて整理する。判断（この kit でどう使うか）は [[openspec-rule]]（`shared-rules/openspec-integration/openspec-rule.md`）を参照。本ファイルは事実のみを持つ。

## インストールと init

- グローバルインストール: `npm install -g @fission-ai/openspec@latest`
- 初期化: `openspec init --tools claude --profile core`（Claude Code 向け、非対話）
- Claude Code 選択時に生成されるもの（本リポジトリでの実測。バージョン 1.10.0）:
  - `.claude/skills/openspec-{explore,propose,update-change,apply-change,archive-change,sync-specs}/SKILL.md`（6スキル）
  - `.claude/commands/opsx/{explore,propose,update,apply,archive,sync}.md`（6スラッシュコマンド。内容はスキルとほぼ同一）
  - `openspec/config.yaml`（`schema: spec-driven` が既定で入る。`spec-driven` は組み込みスキーマとして最初から存在し、fork しなくても使える）
  - `openspec/specs/`, `openspec/changes/archive/`
- **CLAUDE.md / AGENTS.md への書き込みは発生しなかった**。Claude Code 向けの統合はスキル（`.claude/skills/`）とスラッシュコマンド（`.claude/commands/`）のみで完結する。他ツール（Cursor 等）ではマーカーブロックを CLAUDE.md/AGENTS.md 相当のファイルに注入する場合があるとドキュメントに記載があるが、Claude Code では確認されなかった。
- `.claude/skills/openspec-*` および `.claude/commands/opsx/*` は `openspec` CLI が生成する成果物であり、本リポジトリでは `.gitignore` で未追跡にしている（既存の `.claude/skills/` の扱いに揃えた）。クローンした各自が `openspec init` を実行して再生成する前提。

## config.yaml のフィールド

- `schema`: 既定で使うワークフロースキーマ名（例: `spec-driven`）。
- `context`（省略可）: 全アーティファクト生成時に AI へ渡されるプロジェクト背景。**生成されるアーティファクトには一切コピーされない**（`openspec-propose` スキルの契約として明記されている。「context/rules は AI への制約であり、ファイルの内容ではない」）。
- `rules`（省略可）: アーティファクト種別（`proposal` / `design` / `tasks` 等）ごとの制約。これも生成物にはコピーされない。
- `operations`（省略可）: `apply` / `archive` の実行時ガイダンス（`guidance:` 配列）。

## schema の仕組み

- `openspec schema which <name>` で解決元（`package` = 組み込み / `project` = ローカル）とパスを確認できる。
- `openspec schema fork <source> <name>` で `openspec/schemas/<name>/` にテンプレート一式（`schema.yaml` + `templates/{proposal,design,spec,tasks}.md`）をコピーする。
- **同名で fork するとローカル版が組み込み版を shadow する**（本リポジトリで実測: `openspec schema fork spec-driven spec-driven` 後、`openspec schema which spec-driven` の `Source` が `project` に変わり、`Shadows: package: ...` と表示される）。
- `openspec schema validate <name>` でフォーク後のスキーマ構造・テンプレートの妥当性を検証できる。
- **`openspec schema fork` の source は登録済みのスキーマ名のみを受け付ける**（本リポジトリで実測: 任意のファイルパスを渡すと `Schema '<path>' not found` で失敗する）。他リポジトリの `openspec/schemas/` を直接 fork 元に指定することはできない。
- **`openspec store`**（マシンに登録する共有 OpenSpec リポジトリ、`--store <id>` で参照）は schema と specs/changes を常にセットで共有する設計で、schema だけを共有し specs/changes は作業リポジトリごとに残す、という部分共有はサポートしない。この2点が、`openspec-setup`/`openspec-workflow` という**スキル**（プラグイン経由で配布される）で導入・進行ロジックを持たせる方式に転換した理由（判断は [[openspec-rule]] を参照）。

### spec-driven スキーマの4アーティファクト

`proposal → specs → design → tasks` の順（`schema.yaml` の `requires` で依存関係が定義される）。各アーティファクトの生成指示は `schema.yaml` の `instruction:`（自然文）で与えられ、`templates/*.md` はその出力の**骨格**（見出し＋ HTML コメントのプレースホルダ）を提供する。

- `proposal.md`: Why / What Changes / Capabilities（New/Modified） / Impact
- `specs/<capability-path>/spec.md`: 振る舞い契約（ADDED/MODIFIED/REMOVED/RENAMED Requirements、`#### Scenario:` 形式）
- `design.md`: Context / Goals-NonGoals / Decisions / Risks-Trade-offs（複雑な変更のみ作成。生成要否は `instruction` が条件付きで示す）
- `tasks.md`: `- [ ] N.M タスク` のチェックボックス形式。`apply` フェーズはこのチェックボックスをパースして進捗を追跡するため、この形式を外れたタスクは追跡されない。

## テンプレートへのカスタム注記の埋め込み

`templates/*.md` 内の HTML コメント（例: `<!-- Explain the motivation... -->`）は、生成 AI（`openspec-propose` 等のスキル）が「このセクションに何を書くか」を判断するためのインライン指示であり、最終的な生成物では実コンテンツに置き換えられる（既存の英語コメントと同じ扱い）。この kit のルールファイルへの参照ポインタも同じ形式（HTML コメント）で追記しており、ルール本文そのものはコピーしていない。

## CLI 生成スキルの実際の挙動（6スキル全文を実測確認）

- `openspec-explore` / `openspec-update-change` / `openspec-sync-specs`: いずれも実装コードの変更を明示的に禁止している（"Never edit code" 等）。委譲・レビューに関する制約と衝突しない。
- `openspec-propose`: proposal/specs/design/tasks の各アーティファクトを生成するのみでコードは書かない。`context`/`rules` は「AI への制約であり生成物にコピーしない」契約が明記されている（上記 config.yaml 節の出典）。
- `openspec-apply-change`: 未完了タスクごとに **"Make the code changes required"（自分で直接実装する）** と明記されている。どの既存プロジェクトの実装委譲ルールも参照しない。
- `openspec-archive-change`: タスク完了状況・spec 同期状況の確認は行うが、**「実装者と別のエージェントがレビューしたか」を確認する工程は無い**。

この2点（`openspec-apply-change` が直接実装する・`openspec-archive-change` にレビューゲートが無い）が、[[openspec-workflow]] がこれら2つの CLI 生成スキルを直接起動しない理由。

**`.claude/settings.json` の `permissions.deny` は `Skill(<name> *)` 構文でスキル単位のブロックに対応している**（本リポジトリで実機確認済み: `permissions.deny: ["Skill(openspec-apply-change *)", "Skill(openspec-archive-change *)"]` を設定した状態で該当スキルを実際に呼び出すと `Skill execution blocked by permission rules` で拒否され、対象外の `openspec-explore` は通常どおり起動した。設定変更はセッション再起動やCLIの `/hooks` 再読込なしに反映された）。公式ドキュメントの permission rule 対象ツール一覧には `Skill` が明記されていない箇所があるが、上記の実機確認が優先する事実。

## `openspec-setup` / `openspec-workflow`（matagi 側スキル）

- `openspec-setup`: `plugins/matagi/skills/openspec-setup/SKILL.md`。上記の `npm install` → `openspec init --tools claude --profile core` → `openspec schema fork spec-driven spec-driven` → テンプレート・config.yaml へのポインタ埋め込み → `openspec schema validate spec-driven` を、作業ディレクトリごとに再現可能な形でラップする。
- `openspec-workflow`: `plugins/matagi/skills/openspec-workflow/SKILL.md`。explore/propose/update-change/sync-specs は CLI 生成スキルをそのまま使い、apply は `openspec status --change <name> --json` と `openspec instructions apply --change <name> --json` を直接叩いて進捗・`contextFiles`・タスク一覧を取得し、タスクごとの実装は既存の産出 skill（tdd-workflow/coding/test-coding）へ委譲する。archive はレビュー完了後にのみ CLI 生成の `openspec-archive-change` を起動する。

## フェーズワークフロー

`explore`（任意・壁打ち） → `propose`（proposal/design/specs delta/tasks.md 一式を生成） → `apply`（tasks.md を1つずつ実装） → `archive`（specs delta を `openspec/specs/` にマージし `openspec/changes/archive/` へ格納）。スペックだけを本流に取り込みたい場合は `sync-specs` を使う。

Claude Code では `openspec-*`（`.claude/skills/`、グローバル/プロジェクトローカルいずれの経路でインストールされていても同じ内容）と `/opsx:*`（`.claude/commands/`）は同一の内容を指す。

## 参照

- 公式リポジトリ: https://github.com/Fission-AI/OpenSpec
- ドキュメント: `docs/installation.md`, `docs/customization.md`, `docs/cli.md`, `docs/README.md`（同リポジトリ内）
