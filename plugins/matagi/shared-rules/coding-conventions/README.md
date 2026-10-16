# coding-conventions

コーディング規約ルール置き場。

実装時コーディング取り決め = `coding-rule.md`、テスト固有取り決め = `test-rule.md`、TDD 方法論 = `tdd-rule.md`、coding/test-coding/coding-review スキルの domain 判定・委譲基準 = `domain-classification-rule.md` に集約。`coding-rule.md`・`test-rule.md` のうち機械判定可能項目（linter対応可能）= それぞれ `coding-lint-rule.md` / `test-lint-rule.md` に分離。

| ファイル | 内容 |
|---------|------|
| `coding-rule.md` | 命名・TypeScript・定数・スタイリング・関数設計・hooks など、文脈依存でレビューのみ検出可能な実装全般規約 |
| `coding-lint-rule.md` | `coding-rule.md` のうち機械判定可能項目と対応 ESLint ルール名 |
| `test-rule.md` | テスト命名・分割・ヘルパー・AAA パターンなど、文脈依存でレビューのみ検出可能なテスト固有規約 |
| `test-lint-rule.md` | `test-rule.md` のうち機械判定可能項目と対応 `eslint-plugin-jest` 等ルール名 |
| `tdd-rule.md` | TDD 核心哲学・List-Red-Green-Refactor-Commit サイクル・コーディング標準 |
| `domain-classification-rule.md` | coding / test-coding / coding-review スキルの domain（frontend/backend等）判定基準と、専用サブエージェント無い場合の委譲方針 |
