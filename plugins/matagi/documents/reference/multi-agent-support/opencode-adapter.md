# OpenCode アダプタ

issue #60。`plugins/matagi/` を OpenCode（sst/opencode）から利用するための変換・配線スクリプトと、その前提事実・導入手順をまとめる。判断基準は既存ルールに委ね、本ドキュメントは OpenCode 固有の事実・使い方のみを持つ。

## OpenCode の拡張機構（前提事実）

2026-10 時点、実機（opencode 1.18.35）と公式ドキュメント（opencode.ai/docs）で確認した。

- **プラグイン単位のバンドルは無い。** skills・agents・plugins・instructions はそれぞれ別の場所から読み込まれる。設定ルートはプロジェクトの `.opencode/` とグローバルの `~/.config/opencode/`。
- **skills** は `.opencode/skills/<name>/SKILL.md`（`.claude/skills/`・`.agents/skills/` も読む）。`name` は必須でディレクトリ名と一致させる。フォーマットは Claude Code とほぼ同一。
- **skills の呼び出しは description ベース。** OpenCode は `skill` ツールで全スキルの name / description を `<available_skills>` としてモデルへ提示し、モデルが選んで呼ぶ。Claude Code の自動発火と機構は違うが、説明文を手がかりにモデルが選ぶ点は同じ。
- **`commands/` は自動トリガーを持たない。** `/<name>` の明示呼び出しのみで、`description` は TUI 表示用。issue #60 要件1の確認結果で、SKILL.md 相当は `commands/` ではなく `skills/` に置く（明示呼び出し前提への設計変更は不要）。
- **agents** は `.opencode/agents/<name>.md`。ファイル名がエージェント名、frontmatter は `description`（必須）・`mode`（`subagent` / `primary` / `all`）・`permission` 等。`name` フィールドは無い。
- **plugins** は `.opencode/plugins/*.ts`（起動時に自動ロード）。`export const X = async (ctx) => ({ "tool.execute.before": async (input, output) => { ... } })` の形で、**例外を投げるとツール実行を止められる**。`input.tool` はツール名、`output.args` が引数。編集系は `edit` / `write`（`filePath`）と `apply_patch`（`patchText`、書式は Codex と同一）、シェルは `bash`（`command`）。
- **rules 相当**は `AGENTS.md`（無ければ `CLAUDE.md` にフォールバック）に加え、`opencode.json` の `instructions` でファイル・glob・URL を追加できる。

出典: [Plugins](https://opencode.ai/docs/plugins/)、[Agents](https://opencode.ai/docs/agents/)、[Skills](https://opencode.ai/docs/skills/)、[Rules](https://opencode.ai/docs/rules/)、[Commands](https://opencode.ai/docs/commands/)。

## 対応方針

`plugins/matagi/` を唯一の source of truth のまま維持し、複製しない。

| 対象 | 方式 | 実装 |
|------|------|------|
| skills | symlink（変換不要） | `link-source-dirs.ts` |
| agents | `description` + `mode: subagent` へ変換 | `generate-agents-md.ts` |
| hooks | プラグインを symlink。ロジックは既存 `hooks/*.ts` を子プロセスで再利用 | `matagi-hooks.ts` / `hooks-bridge.ts` |
| rules | **変換不要** | — |

### hooks を移植せず再利用する理由

issue #60 起票時は「`hooks/*.py` を TypeScript へ移植する」前提だったが、#57 で hooks は TypeScript へ移行済み。さらに既存フックは「stdin に Claude Code 形式の JSON を受け、stdout に deny JSON を返す」という言語非依存の契約を持つ。プラグイン側でツール名・引数名を写して同じ契約で呼べば、判定ロジック（コマンド解析・保護ブランチ判定・`apply_patch` ヘッダ検査）を二重管理せずに済む（DRY）。`hooks-bridge.ts` の対応は次のとおり。

| OpenCode ツール | フック入力 `tool_name` | 引数の対応 |
|----------------|----------------------|-----------|
| `bash` | `Bash` | `command` → `command`（`workdir` があれば `cwd` として優先） |
| `edit` / `multiedit` / `write` | `Edit` / `Edit` / `Write` | `filePath` → `file_path` |
| `apply_patch` | `apply_patch` | `patchText` → `command` |

フックはプラグイン内から同期（`spawnSync`、各 5 秒でタイムアウト）で起動する。起動失敗・タイムアウトはどちらも許可（fail-open）で、stderr にスクリプト名つきで原因を残す。フックの起動に失敗した・終了コードが非 0・出力が壊れている場合は許可する（fail-open）。ただし保護が黙って外れないよう原因を stderr に1行残す（既存フックと同じ方針）。`node`（22.6 以降、`--experimental-strip-types`）が PATH に必要。

### rules を変換しない理由

rules はすべて参照層 `shared-rules/` にあり、ルート `AGENTS.md` の索引からパス指定で必要時に読まれる運用である（[[codex-adapter]] §rules を変換しない理由と同じ）。OpenCode も `AGENTS.md` を読むため追加の配線は要らない。`opencode.json` の `instructions` に `shared-rules/**` を列挙すると全ルールが常時ロードされ注意予算を浪費するため、**既定では設定しない**。特定ルールを常時ロードしたい場合のみ、そのパスを個別に `instructions` へ追加する。

## 導入手順

リポジトリルートで実行する（出力先は `.opencode`）。

```
node --experimental-strip-types plugins/matagi/adapters/opencode/link-source-dirs.ts .opencode
node --experimental-strip-types plugins/matagi/adapters/opencode/generate-agents-md.ts .opencode
```

- `.opencode/skills/*` と `.opencode/plugins/matagi-hooks.ts` は `plugins/matagi/` への symlink（絶対パス）で、マシン固有のため git 管理外。clone 後に上記を再実行して生成する。
- `.opencode/agents/` は source から派生する生成物のため git 管理外。再生成時の上書き・削除の扱いは `adapters/opencode/README.md` を参照。
- `link-source-dirs.ts` は、出力先が `plugins/matagi/` 配下（またはそこへ落ちる symlink）なら中止する。symlink 以外の既存物は削除せずエラーにする。
- 設定は起動時に一度だけ読まれ再読み込みされない。生成後は OpenCode を再起動する。
- 初回起動時、OpenCode がプラグインの依存（`@opencode-ai/plugin`）を `.opencode/` 配下に取得する（`.opencode/node_modules` 等は git 管理外）。

## 実機検証状況

- **確認済み**（opencode 1.18.35、API 呼び出しなしのデバッグコマンド）: `opencode agent list` が変換後の agents 12 件を subagent として認識すること。`opencode debug skill` が symlink 経由のスキル 15 件を認識すること。`opencode debug config` が `matagi-hooks.ts` をプラグインとして登録すること。`toGuardPayload` / `findDenyReason` が実フックを起動し、保護ブランチ上の `git commit`・`edit`・`apply_patch` と `gh pr merge` を拒否することを単体テストで検証済み。
- **未確認**: symlink 経由でロードされたプラグインの相対 import が実体パスで解決されること（プラグイン登録と依存取得までは確認したが、フック発火は未確認）。`bash` の `workdir` 引数の実在（レビュー指摘を受けた推測ベースの対応）。サブエージェント内のツール呼び出しでもフックが発火すること。実セッション（モデル呼び出し）で `tool.execute.before` が発火し deny が効くこと（モデル API が要るため見送った）。`edit` 以外の編集系ツール（`multiedit` 等、将来追加分を含む）の網羅。`skill` ツール経由での個々のスキルの選択精度。subagent 委譲（coding → backend-coder 等）の成立。`skills/*/SKILL.md` 内の Claude Code 固有ツール名（`Agent`・`Skill` 等）が OpenCode 上でどう解釈されるか。

## 未確定事項（残るもの）

- 上記「未確認」の実機検証。
- **割り切り**: `bash` 経由のファイル書き込みは追わない（`issue-driven-rule.md` §担保表と同じ扱い。着地は commit / push の拒否で担保する）。

## 関連

- [[multi-agent-support]]（`documents/research/multi-agent-support.md`） — issue #55 時点の3エージェント横断調査・対応方針
- [[codex-adapter]]（`documents/reference/multi-agent-support/codex-adapter.md`） — 同型の先行実装（issue #58）
- [[structure-rule]]（`matagi-kaji/shared-rules/repository-structure/structure-rule.md`） — `plugins/matagi/` を唯一の source of truth とする原則
