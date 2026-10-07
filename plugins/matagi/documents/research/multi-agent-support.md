# Codex / Antigravity / OpenCode 対応調査

issue #55。matagi を Claude Code 以外のエージェント（Codex CLI・Google Antigravity・OpenCode）からも呼べるか、仕様調査した結果と対応方針。

## 調査サマリ

| 観点 | Claude Code | Codex CLI | Google Antigravity | OpenCode |
|------|-------------|-----------|---------------------|----------|
| マニフェスト/プラグイン単位 | `plugin.json` + `marketplace.json` | 無し。`.codex/skills/<name>/SKILL.md` 単位 | `plugin.json`（skills/agents/rules/hooks/MCP バンドル） | `opencode.json` 中心。`plugins/*.ts` がエントリポイント |
| config 置き場所 | `.claude/` | `~/.codex/config.toml` / `.codex/config.toml` | `.agents/`（ワークスペース）／`~/.gemini/antigravity-cli/plugins/<name>/`（インストール先） | `.opencode/` / `~/.config/opencode/` |
| rules 相当（毎セッション自動ロード） | CLAUDE.md + `.claude/rules` symlink | `AGENTS.md`（git root〜cwd を連結、既定32KiB上限） | `AGENTS.md` / `GEMINI.md` + `.agents/rules/` | `AGENTS.md` + `opencode.json` で追加 instruction ファイル指定 |
| hooks 相当（コード強制） | hooks（`settings.json` 配線） | あり（`.codex/config.toml` の `[[hooks.PreToolUse]]`、Claude Code とほぼ同一形式。issue #58 で実機・公式ドキュメント確認） | `hooks.json`（5コアcheckpoint、`matcher` で対象指定） | あり。プラグインが event hook を返す（`command.executed` 等多数） |
| SKILL.md 自動トリガー相当 | あり（description ベース自動発火） | あり。**フォーマットは Claude Code とほぼ同一（cross-agent standard）** | あり（`SKILL.md` 明記、Claude Code とほぼ同型） | `commands/` 配下 Markdown。自動トリガーの有無は未確認（明示 `/呼び出し` 前提の可能性） |
| サブエージェント定義相当 | `agents/*.md`（frontmatter） | `.codex/agents/*.toml`（**TOML、フォーマット別**） | `agent.md`（frontmatter、`invoke_subagent` で動的スポーン） | `agents/*.md` または `opencode.json` 内定義（frontmatter、Claude Code に近い） |

出典は各 fork 調査時点（2026-09時点、いずれも公式ドキュメント優先）。Antigravity・OpenCode は登場・更新が速く、一次情報の網羅度が限定的な点に注意。

## 対応方針

**共通方針**: `plugins/matagi/` を source of truth のまま維持し、複製しない。各エージェント向けに薄い変換層（アダプタ）を追加する形を軸に据える。

### Codex CLI

- SKILL.md はほぼそのまま配置できる見込み（cross-agent standard）。最有力候補。
- `rules/` → Codex の AGENTS.md 連結方式への変換が必要（symlink ではなく「rules 内容を AGENTS.md へ集約」または「参照ファイルとして配置」の二択、要検証）。
- サブエージェント（Markdown frontmatter → TOML）は変換スクリプトが要る。
- hooks（コード強制層）は Codex にネイティブであることを issue #58 で確認した（未確認だった点は解消）。ファイル編集ツールは `apply_patch` のみのため、matcher は Claude Code のツール名から機械変換せず個別に指定する。詳細は [[codex-adapter]]（`documents/reference/multi-agent-support/codex-adapter.md`）参照。

### Google Antigravity

- skills/agents/rules/hooks の4本柱が Claude Code と粒度で一致。変換アダプタが最も作りやすい見込み。
- SKILL.md フォーマットの互換性（frontmatter フィールド名の差異有無）は未検証。
- hooks スクリプト本体（`.py` 等）は流用し、`hooks.json` からの参照だけ配線し直せる可能性が高い。
- `plugin.json` は Claude Code の `plugin.json`/`marketplace.json` と役割が近く、変換スクリプトで自動生成しやすい。
- issue #59 で実装済み: `rules/`・`agents/*.md` は Antigravity 側もプラグイン直下ディレクトリとして持つ仕様のため、**変換せずディレクトリ構造のまま配置する方針**とした（frontmatter の完全互換性は未検証のまま残るため、実配置後の実機確認が要る）。詳細は [[antigravity-adapter]]（`documents/reference/multi-agent-support/antigravity-adapter.md`）参照。

### OpenCode

- `agents/`・`rules/`（AGENTS.md 相当）は Claude Code 構造に近く、変換コストが低い見込み。
- hooks は TypeScript 実装必須。既存 `hooks/*.py` はロジック移植が要る（言語跨ぎの変換、他2エージェントより重い）。
- `commands/` の自動トリガー（SKILL.md 相当の説明文ベース発火）の有無が未確認。無ければ「常に明示呼び出し」前提の設計変更が要る。

## 優先度・順序の示唆

1. **Codex CLI** — SKILL.md がほぼそのまま使える公算が高く、着手コスト最小。ただし hooks 相当の有無を先に確認しないと「コード強制層」の担保方針が決まらない。
2. **Google Antigravity** — 4本柱が対応しており設計の見通しが良い。ただし新しいプロダクトで一次情報が薄く、実装前に frontmatter 互換性の実機検証が要る。
3. **OpenCode** — 構造は近いが hooks が TypeScript 必須で移植コストが最も高い。自動トリガーの有無次第で SKILL.md 相当の設計自体を変える必要が出る可能性がある。

## 未確定事項（issue #55 時点で残るもの）

- ~~Codex CLI の hooks 相当の有無・仕様~~ → issue #58 で解消（ネイティブに存在）。[[codex-adapter]] 参照
- Antigravity の SKILL.md frontmatter フィールドの完全互換性 → issue #59 マージ後、実機（`agy`）でスキル一覧に認識されることを確認した。ただし個々のスキルが description ベースで正しく自動発火するかまでは未検証。`rules/`・`agents/*.md`・`hooks.json` の実機読み込みも未検証のまま残存。詳細は [[antigravity-adapter]]（`documents/reference/multi-agent-support/antigravity-adapter.md`）参照
- OpenCode の commands/ 自動トリガー機構の有無
- 3エージェントとも、`plugins/matagi/` を「複製せず参照」する具体的な配線（シンボリックリンク可否・パス指定の可否）の実機検証 → **Antigravity のみ判明**: ワークスペース `.agents/plugins/<name>/` 配置または `agy plugins install` によるステージングで、各作業リポジトリでの個別配線は不要（[[antigravity-adapter]] 参照）。Codex CLI は issue #58 で判明（skills・hooks は symlink、agents は変換、詳細は [[codex-adapter]]）。OpenCode は未検証のまま残存

いずれも各エージェント向け実装 issue の中で、対象エージェントに絞って検証する。issue #59 では Antigravity 向けの `plugin.json`/`hooks.json` 変換スクリプトを実装した（`plugins/matagi/adapters/antigravity/`）。

## 関連

- [[structure-rule]]（`matagi-kaji/shared-rules/repository-structure/structure-rule.md`） — `plugins/matagi/` を唯一の source of truth とする原則（本調査の変換先アダプタもこの原則を維持する前提）
- [[harness-rule]]（`matagi-kaji/shared-rules/harness-engineering/harness-rule.md`） — hooks 相当（コード強制層）の要否判定
