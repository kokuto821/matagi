# リポジトリ構造とファイル配置ルール

## source of truth

すべてのコンテンツは `plugins/matagi/` と `plugins/matagi-kaji/` 配下が唯一の source of truth（2プラグイン構成。駆動開発系は `plugins/matagi/`、ハーネス作成系は `plugins/matagi-kaji/`）。

これらのディレクトリは `.claude-plugin/marketplace.json` 経由でマーケットプレイスプラグイン（`matagi` / `matagi-kaji`）として読み込まれる。コンテンツを複製する手動の symlink / junction 同期は行わない。プラグイン間で共通に必要なルールも複製せず、一方に実体を置き他方からは `[[link]]`＋プラグイン名を含む実パスで跨いで参照（[[directory-rule]] §相互リンク記法）。

## ファイルの配置先

**新しいファイルは必ず `plugins/matagi/<カテゴリ>/` または `plugins/matagi-kaji/<カテゴリ>/` 配下に置く。**判断基準は「対象読者・利用場面が matagi 自体（プロンプト・スキル・エージェント・ルール等のステアリング資産）の設計・レビューに閉じるか」。閉じるなら `matagi-kaji`（例: prompt-review・harness-review・create-skill の対象領域）。それ以外（issue 駆動・TDD・コーディング・テスト等、外部プロジェクトのコードや開発フローを対象にする資産）は `matagi`。迷ったら既存の類似資産がどちらのプラグインにあるか参照。

| 種類 | 正しい配置先 |
|------|------------|
| スキル | `plugins/matagi/skills/<skill-name>/SKILL.md` |
| ルール（任意タイミングで参照） | `plugins/matagi/shared-rules/<topic>/<category-rule>.md` |
| 調査・経緯ドキュメント（判断に至った過程・未確定事項） | `plugins/matagi/documents/research/<file>.md` |
| 参照ドキュメント（確定した事実・外部仕様のまとめ） | `plugins/matagi/documents/reference/<topic>/<file>.md` |
| 経験・知見メモ | `plugins/matagi/knowledge/<category>/<file>.md` |
| サブエージェント | `plugins/matagi/agents/<name>.md` |
| フックスクリプト | `plugins/matagi/hooks/<name>.<ext>`（配線は `.claude-plugin/plugin.json` の `hooks`） |
| 他エージェント向け変換スクリプト（アダプタ） | `plugins/matagi/adapters/<agent-name>/<file>`（source of truth を複製せず変換する層。判断基準は各アダプタの背景 issue・reference ドキュメントを参照） |
| テンプレート | `plugins/matagi/template/<category>/` |

プロジェクトルート直下や `.claude/` 配下にコンテンツの実ファイルを直接作成しない。`.claude/` は `settings.local.json` 等のローカル設定のみ置く。

## マーケットプレイス読み込み

- スキル・ルール・エージェント・ドキュメント等は `plugins/matagi/` 配下に置けば、マーケットプレイスプラグイン経由で読み込まれる。
- 新規追加・削除後の手動同期は不要。反映は Claude Code の再起動（プラグイン再読込）で足りる。
- カタログ: `.claude-plugin/marketplace.json` ／ プラグインマニフェスト: `plugins/matagi/.claude-plugin/plugin.json`

## よくある誤り

- ❌ プロジェクトルートに `.md` ファイルを直置きする（AGENTS.md を除く）
- ❌ `.claude/` 配下にコンテンツの実ファイルを作成する
- ✅ `plugins/matagi/<カテゴリ>/` 配下に置く

## openspec/ の扱い

`openspec/`（リポジトリ直下に置く想定のディレクトリ）は OpenSpec（仕様駆動開発ツール）の実体。**このリポジトリ自身には常設しない**。実際に OpenSpec を使うのは matagi をマーケットプレイスプラグインとして導入した作業リポジトリ側。`openspec/config.yaml` やフォークしたスキーマは作業リポジトリごとのローカルファイルのため、この kit のコンテンツ（`plugins/matagi/`、マーケットプレイス配布対象）としては持てない。

- 作業リポジトリへの導入・置き場所（`config.yaml` / `schemas/` / `specs/` / `changes/` を commit する等）は `plugins/matagi/skills/openspec-setup/SKILL.md` が担う。
- OpenSpec のフェーズと既存 skill（tdd/coding/coding-review/github-issue-resolve 等）の役割分担・apply/archive の進行は `matagi/shared-rules/openspec-integration/openspec-rule.md`・`matagi/skills/openspec-workflow/SKILL.md` を参照。
- `openspec` CLI の挙動等の事実は `matagi/documents/reference/spec-driven-development/openspec-overview.md` を参照。
