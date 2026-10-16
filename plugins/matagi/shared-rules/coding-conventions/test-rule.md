# テストルール

テスト命名・構造・分割・ヘルパー・記述スタイル規定。`coding-rule.md` から分離したテスト専用規約。

機械判定可能ルール（ヘルパー関数命名・describe ネスト制限・`it()`禁止・500行制限・`toStrictEqual`使用）→ `test-lint-rule.md` 参照。本ファイル = 文脈依存でレビューのみ検出可能な項目を残す。

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| テストファイル | 対象ファイル名 + `.test.ts` | `swipeUtils.test.ts` |
| テストヘルパーファイル | camelCase + `Helpers.ts` サフィックス | `swipeTestHelpers.ts` |

---

## 同一構造テストのまとめ方

- 入力のみ異なり構造同一の複数テスト → `test.each` でまとめる

```typescript
// ✅ 良い例
describe('determineSwipeDirection', () => {
  test.each([
    { deltaX: 20, threshold: 10, expected: 'right' },
    { deltaX: -20, threshold: 10, expected: 'left' },
  ])('deltaX=$deltaX の場合、$expected を返す', ({ deltaX, threshold, expected }) => {
    const params = createSwipeParams({ deltaX, threshold });
    expect(determineSwipeDirection(params)).toBe(expected);
  });
});

// ❌ 悪い例（構造重複）
describe('determineSwipeDirection', () => {
  test('deltaXが20の場合、rightを返す', () => {
    const params = createSwipeParams({ deltaX: 20, threshold: 10 });
    expect(determineSwipeDirection(params)).toBe('right');
  });

  test('deltaXが-20の場合、leftを返す', () => {
    const params = createSwipeParams({ deltaX: -20, threshold: 10 });
    expect(determineSwipeDirection(params)).toBe('left');
  });
});
```

---

## ファイル分割

- ファイル行数上限 → `test-lint-rule.md` 参照。上限超過時 関心ごと別ファイル分割を検討

```
feature/map/utils/__tests__/
├── swipeUtils.test.ts             # 500行以内に収まる単位で管理
├── swipeUtils.direction.test.ts   # 分割が必要になった場合
└── swipeUtils.threshold.test.ts
```

---

## テストヘルパーの共通化

- 複数テストで使い回せるロジック = **テストヘルパー**として切り出す
- ヘルパーファイル = `__tests__/helpers/` ディレクトリ配置

```typescript
// __tests__/helpers/swipeTestHelpers.ts

/**
 * スワイプイベントのモックパラメータを生成するヘルパー
 */
export const createSwipeParams = (
  overrides: Partial<DetermineSwipeDirectionParams> = {}
): DetermineSwipeDirectionParams => ({
  deltaX: 0,
  deltaY: 0,
  threshold: 10,
  disableUpSwipe: false,
  ...overrides,
});
```

---

## AAA パターン

- テスト = **Arrange（準備）→ Act（実行）→ Assert（検証）** 3ステップ記述
- 各ステップ コメントで明示

```typescript
test('deltaXが閾値を超えた場合、右スワイプを返す', () => {
  // Arrange
  const params = createSwipeParams({ deltaX: 20, threshold: 10 });

  // Act
  const result = determineSwipeDirection(params);

  // Assert
  expect(result).toBe('right');
});
```

---

## 関連ルール

- [[test-lint-rule]]（`shared-rules/coding-conventions/test-lint-rule.md`） — 機械判定可能ルール（本ファイルからの分離先）
