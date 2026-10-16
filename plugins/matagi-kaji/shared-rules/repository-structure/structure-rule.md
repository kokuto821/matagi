# リポジトリ構造とファイル配置ルール

## source of truth

全コンテンツ: `plugins/matagi/`・`plugins/matagi-kaji/` 配下が唯一の source of truth（2プラグイン構成。駆動開発系 `plugins/matagi/`、ハーネス作成系 `plugins/matagi-kaji/`）。

両ディレクトリは `.claude-plugin/marketplace.json` 経由でマーケットプレイスプラグイン（`matagi` / `matagi-kaji`）として読込。コンテンツ複製の手動 symlink / junction 同期は行わない。プラグイン間共通必要ルールも複製せず、一方に実体を置き他方から `[[link]]`＋プラグイン名含む実パスで跨いで参照（[[directory-rule]] §相互リンク記法）。

## ファイルの配置先

**新規ファイルは必ず `plugins/matagi/<カテゴリ>/` または `plugins/matagi-kaji/<カテゴリ>/` 配下に置く。**判断基準「対象読者・利用場面が matagi 自体（プロンプト・スキル・エージェント・ルール等ステアリング資産）の設計・レビューに閉じるか」。閉じる → `matagi-kaji`（例: prompt-review・harness-review・create-skill の対象領域）。それ以外（issue 駆動・TDD・コーディング・テスト等、外部プロジェクトのコード・開発フローを対象にする資産）→ `matagi`。迷い → 既存類似資産がどちらのプラグインにあるか参照。

| 種類 | 正しい配置先 |
|------|------------|
| スキル | `plugins/matagi/skills/<skill-name>/SKILL.md` |
| ルール（任意タイミング参照） | `plugins/matagi/shared-rules/<topic>/<category-rule>.md` |
| 調査・経緯ドキュメント（判断に至る過程・未確定事項） | `plugins/matagi/documents/research/<file>.md` |
| 参照ドキュメント（確定事実・外部仕様まとめ） | `plugins/matagi/documents/reference/<topic>/<file>.md` |
| 経験・知見メモ | `plugins/matagi/knowledge/<category>/<file>.md` |
| サブエージェント | `plugins/matagi/agents/<name>.md` |
| フックスクリプト | `plugins/matagi/hooks/<name>.<ext>`（配線は `.claude-plugin/plugin.json` の `hooks`） |
| 他エージェント向け変換スクリプト（アダプタ） | `plugins/matagi/adapters/<agent-name>/<file>`（source of truth を複製せず変換する層。判断基準は各アダプタの背景 issue・reference ドキュメント参照） |
| テンプレート | `plugins/matagi/template/<category>/` |

プロジェクトルート直下・`.claude/` 配下にコンテンツ実ファイルを直接作成しない。`.claude/` は `settings.local.json` 等ローカル設定のみ置く。

## マーケットプレイス読み込み

- スキル・ルール・エージェント・ドキュメント等は `plugins/matagi/` 配下に置けばマーケットプレイスプラグイン経由で読込。
- 新規追加・削除後の手動同期は不要。反映は Claude Code 再起動（プラグイン再読込）で足りる。
- カタログ: `.claude-plugin/marketplace.json` ／ プラグインマニフェスト: `plugins/matagi/.claude-plugin/plugin.json`

## よくある誤り

- ❌ プロジェクトルートに `.md` ファイルを直置き（AGENTS.md を除く）
- ❌ `.claude/` 配下にコンテンツ実ファイルを作成
- ✅ `plugins/matagi/<カテゴリ>/` 配下に置く

## openspec/ の扱い

`openspec/`（リポジトリ直下に置く想定のディレクトリ）= OpenSpec（仕様駆動開発ツール）の実体。**本リポジトリ自身には常設しない**。実際に OpenSpec を使うのは matagi をマーケットプレイスプラグイン導入した作業リポジトリ側。`openspec/config.yaml`・フォークしたスキーマは作業リポジトリごとのローカルファイルのため、本 kit のコンテンツ（`plugins/matagi/`、マーケットプレイス配布対象）としては持てない。

- 作業リポジトリへの導入・置き場所（`config.yaml` / `schemas/` / `specs/` / `changes/` を commit する等）は `plugins/matagi/skills/openspec-setup/SKILL.md` 担当。
- OpenSpec フェーズ・既存 skill（tdd/coding/coding-review/github-issue-resolve 等）の役割分担・apply/archive 進行: `matagi/shared-rules/openspec-integration/openspec-rule.md`・`matagi/skills/openspec-workflow/SKILL.md` 参照。
- `openspec` CLI 挙動等の事実: `matagi/documents/reference/spec-driven-development/openspec-overview.md` 参照。
