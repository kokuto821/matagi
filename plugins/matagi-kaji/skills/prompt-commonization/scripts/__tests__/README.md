# __tests__

`prompt-commonization/scripts/` のテスト一式（vitest）。

- `parse` / `expand` / `check` / `detect` / `apply` / `cli` / `node-io`: 各モジュールの単体テスト。ファイル入出力は差し替え可能な関数で注入し、実ファイルに触れない
- `cli-process`: 実際に `node` で起動する結合テスト。一時ディレクトリを使い、テストごとに作って消す
- `helpers.ts`: 複数のテストで共有する定数・入力生成ヘルパー

実行: `cd plugins/matagi-kaji && npm test`
