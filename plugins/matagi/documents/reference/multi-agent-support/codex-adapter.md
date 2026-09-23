# Codex CLI アダプタ

issue #58。`plugins/matagi/` を Codex CLI（openai/codex）から利用するための変換スクリプトと、その前提事実・導入手順をまとめる。判断基準は `shared-rules/issue-driven-development/issue-driven-rule.md` 等の既存ルールに委ね、本ドキュメントは Codex 固有の事実・使い方のみを持つ。

## Codex CLI の拡張機構（前提事実）

2026-09 時点、実機（codex-cli 0.156.0）と公式ドキュメントで確認した。

- **プラグイン単位のバンドルは無い。** skills・agents・hooks・AGENTS.md はそれぞれ別の場所から読み込まれる。
- **hooks（コード強制層）はネイティブにある。** `<repo>/.codex/config.toml`（または `hooks.json`）の `[[hooks.PreToolUse]]` で、`matcher`（`tool_name` への正規表現）にマッチしたツール実行前にコマンドを起動する。拒否は stdout に `hookSpecificOutput.permissionDecision: "deny"` の JSON を返すか、終了コード 2 で行う。入出力フォーマットは Claude Code とほぼ同一。issue #55 時点の「hooks 相当は不明」は本 issue で解消した。
- **ファイル編集ツールは `apply_patch` のみ。** Claude Code の `Edit` / `Write` / `NotebookEdit` に相当するツール名は無く、パッチ本文は `tool_input.command` に入る。
- **skills** は `.codex/skills/<name>/SKILL.md` をスキル単位で読み込む。フォーマットは Claude Code とほぼ同一（cross-agent standard）。
- **agents** は `.codex/agents/<name>.toml`。必須は `name` / `description` / `developer_instructions`（Markdown+frontmatter とは形式が異なる）。
- **rules 相当**は git root〜cwd の `AGENTS.md` 連結（既定 32KiB 上限）。

出典: [Hooks](https://developers.openai.com/codex/hooks)、[Subagents](https://developers.openai.com/codex/subagents)。

## 対応方針

`plugins/matagi/` を唯一の source of truth のまま維持し、複製しない。

| 対象 | 方式 | 実装 |
|------|------|------|
| skills | symlink（変換不要） | `link-source-dirs.ts` |
| hooks 本体 `hooks/*.ts` | symlink（変更しない） | `link-source-dirs.ts` |
| hooks 配線 | `config.toml` を生成 | `generate-hooks-config.ts` |
| agents | md → toml に変換 | `generate-agents-toml.ts` |
| rules | **変換不要** | — |

### rules を変換しない理由

`plugins/matagi/rules/`（コアルールの自動ロード層）は #76 で廃止済みで、ルールはすべて参照層 `shared-rules/` にある。ルート `AGENTS.md` は「索引＋パス明記」のみを持ち、必要時にモデル自身が該当ファイルを Read する運用である。`[[link]]` は機械解決されず、人間・モデル向けの相互参照タグに過ぎない。したがって Codex が `AGENTS.md` を連結ロードするだけで同じ運用が成立する（現状 約 4.9KB、32KiB 上限に十分な余裕がある）。

### hooks の matcher を機械コピーしない理由

Claude Code の `plugin.json` の matcher は `Bash|Edit|Write|NotebookEdit` だが、Codex にこれらのうち `Bash` 以外のツール名は無く、そのまま複製すると編集系の拒否が発火しない。このため `generate-hooks-config.ts` は hook スクリプトのファイル名単位で Codex 向け matcher を明示するマッピング（`CODEX_MATCHER_OVERRIDES`）を持つ。

| hook | Codex 向け matcher | 備考 |
|------|-------------------|------|
| `protected-branch-guard.ts` | `Bash\|apply_patch` | `apply_patch` 対応は同スクリプト側に実装済み（パッチ本文の見出し行 `*** Update/Add/Delete File:` から対象パスを全件抽出し、保護ブランチ上の追跡対象なら拒否） |
| `pr-merge-guard.ts` | `Bash` | `gh pr merge` を常に拒否 |
| `antigravity-manifest-sync.ts` | 出力しない | Antigravity 専用の同期処理 |

## 導入手順

リポジトリルートで実行する（出力先は `.codex`）。

```
node --experimental-strip-types plugins/matagi/adapters/codex/link-source-dirs.ts .codex
node --experimental-strip-types plugins/matagi/adapters/codex/generate-hooks-config.ts .codex
node --experimental-strip-types plugins/matagi/adapters/codex/generate-agents-toml.ts .codex
```

- `.codex/skills/*` と `.codex/hooks` は `plugins/matagi/` への symlink で、git 管理対象。
- `.codex/config.toml` と `.codex/agents/` は絶対パスを含む／source から派生する生成物のため git 管理外（`.gitignore`）。clone 後に上記を再実行して生成する。
- `config.toml` の `command` には出力先の絶対パスが埋め込まれる（Codex が `${...}` 変数展開をサポートしないため）。
- **hooks は信頼確認が要る。** Codex は非 managed な hooks を、ユーザーが定義内容を確認して信頼するまで実行しない。初回起動時に確認する。

## 実機検証状況

- **確認済み**: codex-cli 0.156.0 がネイティブ PreToolUse hooks を持つこと（公式ドキュメント）。`protected-branch-guard.ts` の `apply_patch` 判定を単体テストで検証済み（保護ブランチ上の追跡対象ファイルを拒否）。生成した `config.toml`・agents TOML 12 件が TOML パーサ（Python `tomllib`）で妥当であること、agents の本文が元 Markdown と完全一致すること。
- **未確認**: Codex 実機での skills 自動検出・description ベースの自動発火（確認には `codex exec` による API 呼び出しが要るため見送った）。生成 `config.toml` の hooks が実機で実際に発火し deny が効くこと（保護ブランチ上での確認は、対応コードがマージされるまで成立しない。symlink は作業ツリー実体を指すため）。`.codex/agents/*.toml` が実機で読み込まれること。

## 未確定事項（残るもの）

- 上記「未確認」の実機検証。
- **既知の制約**: 2026-03 時点の報告として、`spawn_agent` ツールが `agent_type` 等の明示指定のみを受け付け、`.codex/agents/*.toml` の定義済みエージェントを名前で直接呼び出せない事例がある。現行バージョンで解消済みかは未検証。委譲（coding → backend-coder 等）が Codex 上で成立するかはこの点に依存する。
- `skills/*/SKILL.md` 内の Claude Code 固有ツール名（`Agent`・`Skill` 等）への言及が Codex 上でどう解釈されるか。

## 関連

- [[multi-agent-support]]（`documents/research/multi-agent-support.md`） — issue #55 時点の3エージェント横断調査・対応方針
- [[antigravity-adapter]]（`documents/reference/multi-agent-support/antigravity-adapter.md`） — 同型の先行実装（issue #59）
- [[structure-rule]]（`matagi-kaji/shared-rules/repository-structure/structure-rule.md`） — `plugins/matagi/` を唯一の source of truth とする原則
