# コーディングLintルール

`coding-rule.md` のうち**機械判定可能**項目を linter 対応ルールとして分離。決定論的判定で見逃しなし→本来レビューでなく linter に任せる項目（**本 kit 自体 ESLint 設定・hooks 等コード未配線、`frontend-code-reviewer`/`frontend-test-reviewer` もレビュー対象外としているため、導入までの間は検査対象となる保証なし**。詳細 背景節参照）。文脈依存でレビューのみ検出可能な項目 → `coding-rule.md` に残す。

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

Biome `useNamingConvention`／`useFilenamingConvention` = いずれも ESLint 版基準 "inspired"（着想元）実装。任意プリフィックス・カスタムパターン表現力 ESLint 版に劣る。細かい要件 Biome 側オプションで表現しきれない場合あり。

## TypeScript

- `interface` 使わず `export type` 使用 → `@typescript-eslint/consistent-type-definitions`（`type`）／Biome: 対応ルールなし※
- **`any` 型使用しない** → `@typescript-eslint/no-explicit-any` ／ Biome: `suspicious.noExplicitAny`

## 定数

- マジックナンバーは定数化 → `no-magic-numbers` / `@typescript-eslint/no-magic-numbers` ／ Biome: 対応ルールなし※

固定文字列・正規表現リテラル定数化 = 標準 ESLint ルール機械化困難→`coding-rule.md` に残す。

※ Biome公式 ESLint 対応表（`https://biomejs.dev/linter/rules-sources/`）記載なし、相当ルール不在。

## Export パターン

- **Named export 基本**（`export const`）、`default export` = page コンポーネントのみ → `import/no-default-export`（page ファイルのみ `overrides` で除外）／ Biome: `style.noDefaultExport`（`overrides` 相当は Biome の `overrides` 設定で表現）

## 関数設計

- 関数 = **アロー関数**定義 → `func-style`（`expression`）／ Biome: `complexity.useArrowFunction`（`prefer-arrow-callback` 相当、inspired）

## 背景

issue #32。`coding-rule.md` に、命名規則や `any` 禁止など機械検出可能項目と、SRP 分離や型ガード活用など文脈依存でレビューのみ検出可能項目が混在→分離。本ファイル項目 = 各プロダクト ESLint 設定へ反映する一次情報源として使う想定（今後 ESLint 設定導入スキルが参照）。

## 関連ルール

- [[coding-rule]]（`shared-rules/coding-conventions/coding-rule.md`） — 文脈依存でレビュー必要な項目
