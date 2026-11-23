# scripts

`prompt-commonization` スキルが呼ぶスクリプト置き場。プロンプト内の共通文言を検出し、共通文言ファイルへ集約して `@import` ブロックで参照する処理を、コードで決定論的に行う。記法・使い分け・承認の判断基準は `shared-rules/prompt-commonization/commonization-rule.md`。

## 実行

Node v22.6 以降。ビルド不要で直接実行できる。サブコマンド・オプション・終了コードの仕様は `../reference/cli.md`（正は `cli.ts`）。ここには重複して書かない。

```
node --experimental-strip-types prompt-commons.ts <サブコマンド> [オプション]
```

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `prompt-commons.ts` | 公開入口。他モジュールを再 export し、直接実行されたときだけ CLI として動く |
| `cli.ts` | 引数解析とサブコマンドの実行 |
| `plan-schema.ts` | 計画 JSON の検証 |
| `node-io.ts` | 実際のファイル入出力 |
| `markdown-scan.ts` | Markdown の走査と `@import` ブロックの構文解析 |
| `detect.ts` / `apply.ts` / `expand.ts` / `check.ts` | 各サブコマンドの中身 |
| `findings.ts` | 検出結果の型とメッセージ |
| `__tests__/` | テスト一式 |

## テスト

`cd plugins/matagi-kaji && npm test`（vitest）。
