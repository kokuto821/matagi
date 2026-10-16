# テストLintルール

`test-rule.md` のうち**機械判定可能**項目を linter 対応ルールとして分離。決定論的判定で見逃しなし→本来レビューでなく linter に任せる項目（**本 kit 自体 ESLint 設定・hooks 等コード未配線、`frontend-code-reviewer`/`frontend-test-reviewer` もレビュー対象外としているため、導入までの間は検査対象となる保証なし**。詳細 背景節参照）。文脈依存でレビューのみ検出可能な項目 → `test-rule.md` に残す。

## ヘルパー関数の命名

- テストヘルパー関数 = `create` / `make` / `build` プリフィックス → `@typescript-eslint/naming-convention`（`prefix: ['create', 'make', 'build']`）／ Biome: `style.useNamingConvention`（inspired）

## 構造・記述スタイル

- `describe` ネスト = **1層まで** → `eslint-plugin-jest` の `jest/max-nested-describe`（`max: 1`）／ Biome: `complexity.noExcessiveNestedTestSuites`（inspired。閾値変更オプション自体なし・既定5層固定→ESLint 版 `max: 1` と同等の厳格さでは検出不可）
- テストケース = `it()` でなく **`test()`** 記述 → `eslint-plugin-jest` の `jest/consistent-test-it`（`fn: 'test'`）／ Biome: 対応ルールなし※

## ファイル分割

- テストファイルが **500行を超えた場合** → `max-lines` ／ Biome: 対応ルールなし※

## アサーション

- オブジェクト全体検証 = `toEqual` でなく `toStrictEqual` 使用 → `eslint-plugin-jest` の `jest/prefer-strict-equal` ／ Biome: 対応ルールなし※

※ Biome公式 ESLint/eslint-plugin-jest 対応表（`https://biomejs.dev/linter/rules-sources/`）記載なし、相当ルール不在。

テストファイル・ヘルパーファイル命名規則 = 標準 ESLint ルール機械化困難→`test-rule.md` に残す。

## 背景

issue #32。`test-rule.md` に、describe ネスト制限や `it()` 禁止など機械検出可能項目と、AAA パターンやヘルパー切り出し判断など文脈依存でレビューのみ検出可能項目が混在→分離。本ファイル項目 = 各プロダクト ESLint 設定へ反映する一次情報源として使う想定（今後 ESLint 設定導入スキルが参照）。

## 関連ルール

- [[test-rule]]（`shared-rules/coding-conventions/test-rule.md`） — 文脈依存でレビュー必要な項目
