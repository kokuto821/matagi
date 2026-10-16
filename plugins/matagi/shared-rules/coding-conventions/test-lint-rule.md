# テストLintルール

`test-rule.md` のうち、**機械的に判定可能**な項目を linter 対応ルールとして分離したもの。決定論的に判定でき見逃しがないため、本来レビューでなく linter に任せるべき項目（**本 kit 自体には ESLint 設定・hooks 等のコードが未配線で、`frontend-code-reviewer`/`frontend-test-reviewer` からもレビュー対象外としているため、導入までの間は検査対象となる保証なし**。詳細は背景節参照）。文脈依存でレビューでしか検出できない項目は `test-rule.md` に残す。

## ヘルパー関数の命名

- テストヘルパー関数は `create` / `make` / `build` プリフィックス → `@typescript-eslint/naming-convention`（`prefix: ['create', 'make', 'build']`）／ Biome: `style.useNamingConvention`（inspired）

## 構造・記述スタイル

- `describe` のネストは **1層まで** → `eslint-plugin-jest` の `jest/max-nested-describe`（`max: 1`）／ Biome: `complexity.noExcessiveNestedTestSuites`（inspired。閾値変更オプション自体が存在せず既定の5層固定のため、ESLint 版の `max: 1` と同等の厳格さでは検出できない）
- テストケースは `it()` ではなく **`test()`** で記述する → `eslint-plugin-jest` の `jest/consistent-test-it`（`fn: 'test'`）／ Biome: 対応ルールなし※

## ファイル分割

- テストファイルが **500行を超えた場合** → `max-lines` ／ Biome: 対応ルールなし※

## アサーション

- オブジェクト全体検証は `toEqual` でなく `toStrictEqual` を使う → `eslint-plugin-jest` の `jest/prefer-strict-equal` ／ Biome: 対応ルールなし※

※ Biome公式の ESLint/eslint-plugin-jest 対応表（`https://biomejs.dev/linter/rules-sources/`）に記載なし、相当ルールが存在しない。

テストファイル・ヘルパーファイルの命名規則は標準 ESLint ルールでの機械化が難しいため `test-rule.md` に残す。

## 背景

issue #32。`test-rule.md` に、describe ネスト制限や `it()` 禁止など機械的に検出できる項目と、AAA パターンやヘルパー切り出しの判断など文脈依存でレビューでしか検出できない項目が混在していたため分離。本ファイルの項目は各プロダクトの ESLint 設定へ反映する一次情報源として使う想定（今後 ESLint 設定を導入するスキルが参照）。

## 関連ルール

- [[test-rule]]（`shared-rules/coding-conventions/test-rule.md`） — 文脈依存でレビューが必要な項目
