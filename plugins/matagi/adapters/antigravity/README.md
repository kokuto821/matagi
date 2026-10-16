# antigravity

Claude Code 向けプラグインマニフェスト（`plugins/matagi/.claude-plugin/plugin.json`）→ Google Antigravity 向け `plugin.json` / `hooks.json` 変換スクリプト置き場。

- `generate-plugin-json.ts`: `plugin.json` から `name` / `description` 抽出、Antigravity 向け `plugin.json` 出力。
- `generate-hooks-json.ts`: `plugin.json` の `hooks` フィールド → Antigravity hooks.json 形式変換出力。

いずれも `node --experimental-strip-types <script>.ts <出力先ディレクトリ>` 実行。出力先ディレクトリ（= Antigravity プラグインルート）= CLI 引数必須、直下に `plugin.json` / `hooks.json` 書出（ファイル名固定）。引数省略時 エラー案内。

例:

```
node --experimental-strip-types generate-plugin-json.ts /path/to/antigravity-plugin-root
node --experimental-strip-types generate-hooks-json.ts /path/to/antigravity-plugin-root
```
