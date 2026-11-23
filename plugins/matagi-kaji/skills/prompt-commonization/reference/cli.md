# CLI リファレンス

実行時に参照する最小の呼び出し仕様。仕様の正 = `scripts/cli.ts`。食い違い → `scripts/cli.ts` に従う。

呼び出し形式: `node --experimental-strip-types "${CLAUDE_SKILL_DIR}/scripts/prompt-commons.ts" <サブコマンド> [オプション]`

## サブコマンド

| サブコマンド | 役割 |
|-------------|------|
| `detect <path...>` | 複製された文・段落の候補を検出 |
| `apply --plan <file>` | 承認済みの計画を適用（共通文言ファイル作成 + 出現箇所を `@import` ブロックへ置換） |
| `expand <path...>` | `@import` ブロックの本文を共通文言ファイルの最新内容へ更新 |
| `check <path...>` | 本文と共通文言ファイルの食い違い・記法の不正を報告 |

## オプション

| オプション | 対象 | 内容 |
|-----------|------|------|
| `--root <dir>` | 全サブコマンド | パスの基準ディレクトリ。既定 = 現在のディレクトリ |
| `--out <file>` | `detect` | 全候補の JSON を `<file>`（現在のディレクトリ基準）へ書く。標準出力 = 要約 JSON 1行のみ。無指定 = 全量を標準出力 |
| `--limit <n>` | `detect` | 要約に載せる候補数の上限。`--out` 指定時のみ有効。既定値 = スクリプト側が正 |
| `--threshold <n>` | `detect` | 近似一致の類似度の閾値。既定値 = スクリプト側が正 |
| `--min-chars <n>` | `detect` | 候補とする最小文字数。既定値 = スクリプト側が正 |
| `--plan <file>` | `apply` | 計画 JSON のパス。形式 = `plan-format.md` |

## `detect --out` の要約

標準出力に出る1行 JSON。

| フィールド | 内容 |
|-----------|------|
| `total` | 検出した全候補数 |
| `shown` | 要約に載せた候補数 |
| `truncated` | 要約に載せきれなかった候補があるか |
| `outFile` | 全候補を書いたファイル |
| `candidates[]` | `id` / `kind` / `unit` / `similarity` / `occurrenceCount` / `locations`（`file:開始行-終了行`）/ `preview` |

out ファイルの構造 = `--out` なしの標準出力と同じ。

## 終了コード

| コード | 意味 |
|--------|------|
| 0 | 成功 |
| 1 | `check` が指摘あり（`file:line: メッセージ` を標準出力へ） |
| 2 | 使用法・入出力・検証エラー（エラーは標準エラーへ）。どのサブコマンドでも起こりうる |
