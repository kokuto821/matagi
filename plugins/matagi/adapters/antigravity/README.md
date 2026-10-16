# antigravity

Claude Code 向けプラグインマニフェスト（`plugins/matagi/.claude-plugin/plugin.json`）を、Google Antigravity 向け `plugin.json` / `hooks.json` に変換するスクリプト置き場。

- `generate-plugin-json.ts`: `plugin.json` から `name` / `description` を抽出、Antigravity 向け `plugin.json` を出力。
- `generate-hooks-json.ts`: `plugin.json` の `hooks` フィールドを Antigravity の hooks.json 形式に変換して出力。

いずれも `node --experimental-strip-types <script>.ts <出力先ディレクトリ>` で実行。出力先ディレクトリ（= Antigravity プラグインルート）は CLI 引数で必須指定、直下に `plugin.json` / `hooks.json` を書き出す（ファイル名は固定）。引数省略時はエラーで案内。

例:

```
node --experimental-strip-types generate-plugin-json.ts /path/to/antigravity-plugin-root
node --experimental-strip-types generate-hooks-json.ts /path/to/antigravity-plugin-root
```
