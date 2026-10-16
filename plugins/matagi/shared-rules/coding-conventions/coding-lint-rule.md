# コーディングLintルール

`coding-rule.md` のうち、**機械的に判定可能**な項目を linter 対応ルールとして分離したもの。決定論的に判定でき見逃しがないため、本来レビューでなく linter に任せるべき項目（**本 kit 自体には ESLint 設定・hooks 等のコードが未配線で、`frontend-code-reviewer`/`frontend-test-reviewer` からもレビュー対象外としているため、導入までの間は検査対象となる保証なし**。詳細は背景節参照）。文脈依存でレビューでしか検出できない項目は `coding-rule.md` に残す。

## 命名規則

| 対象 | 規則 | 対応する ESLint ルール | 対応する Biome ルール |
|---|---|---|---|
| コンポーネントファイル | PascalCase | `unicorn/filename-case`（`case: 'pascalCase'`） | `style.useFilenamingConvention`（inspired） |
| hooks / utils ファイル | camelCase | `unicorn/filename-case`（`case: 'camelCase'`） | `style.useFilenamingConvention`（inspired） |
| 型定義ファイル | camelCase + `Types.ts` サフィックス | `unicorn/filename-case` + カスタムパターン | `style.useFilenamingConvention`（inspired。カスタムパターンは非対応） |
| boolean 変数 | `is` / `has` プリフィックス | `@typescript-eslint/naming-convention`（`selector: 'variable'`, `types: ['boolean']`, `prefix: ['is', 'has']`） | `style.useNamingConvention`（inspired） |
| state 更新関数 | `set` プリフィックス | `@typescript-eslint/naming-convention`（`prefix: ['set']`） | `style.useNamingConvention`（inspired） |
| コールバック関数 | `on` / `handle` プリフィックス | `@typescript-eslint/naming-convention`（`prefix: ['on', 'handle']`） | `style.useNamingConvention`（inspired） |
| プロジェクト固有コンポーネント | プロジェクト固有プレフィックス | `unicorn/filename-case` + プロジェクト固有パターン | `style.useFilenamingConvention`（inspired。プロジェクト固有パターンは非対応） |
| 定数（オブジェクト/レイアウト） | UPPER_SNAKE_CASE | `@typescript-eslint/naming-convention`（`selector: 'variable'`, `modifiers: ['const']`, `format: ['UPPER_CASE']`） | `style.useNamingConvention`（inspired） |

Biome の `useNamingConvention`／`useFilenamingConvention` はいずれも ESLint 版基準の "inspired"（着想元）実装。任意プリフィックス・カスタムパターンの表現力は ESLint 版に劣る。細かい要件は Biome 側オプションで表現しきれない場合あり。

## TypeScript

- `interface` は使わず `export type` を使用する → `@typescript-eslint/consistent-type-definitions`（`type`）／Biome: 対応ルールなし※
- **`any` 型は使用しない** → `@typescript-eslint/no-explicit-any` ／ Biome: `suspicious.noExplicitAny`

## 定数

- マジックナンバーは定数化する → `no-magic-numbers` / `@typescript-eslint/no-magic-numbers` ／ Biome: 対応ルールなし※

固定文字列・正規表現リテラルの定数化は標準 ESLint ルールでの機械化が難しいため `coding-rule.md` に残す。

※ Biome公式の ESLint 対応表（`https://biomejs.dev/linter/rules-sources/`）に記載なし、相当ルールが存在しない。

## Export パターン

- **Named export を基本**とする（`export const`）、`default export` は page コンポーネントのみ → `import/no-default-export`（page ファイルのみ `overrides` で除外）／ Biome: `style.noDefaultExport`（`overrides` 相当は Biome の `overrides` 設定で表現）

## 関数設計

- 関数は**アロー関数**で定義する → `func-style`（`expression`）／ Biome: `complexity.useArrowFunction`（`prefer-arrow-callback` 相当、inspired）

## 背景

issue #32。`coding-rule.md` に、命名規則や `any` 禁止など機械的に検出できる項目と、SRP 分離や型ガード活用など文脈依存でレビューでしか検出できない項目が混在していたため分離。本ファイルの項目は各プロダクトの ESLint 設定へ反映する一次情報源として使う想定（今後 ESLint 設定を導入するスキルが参照）。

## 関連ルール

- [[coding-rule]]（`shared-rules/coding-conventions/coding-rule.md`） — 文脈依存でレビューが必要な項目
