# コーディングルール

機械的に判定可能なルール（命名規則・`interface`/`any`禁止・export パターン・アロー関数・マジックナンバー定数化）は `coding-lint-rule.md` 参照。本ファイルには文脈依存でレビューでしか検出できない項目を残す。

## 命名規則

- 省略しない完全な名前を使用
- `coordinate` 等、汎用的すぎる名前を避ける。型があっても意味が伝わらない名前は不可。値の意味が伝わる名前にする

```typescript
// ✅ 良い例
const touchCoordinate = { x: clientX, y: clientY };

// ❌ 悪い例
const coordinate = { x: clientX, y: clientY };
```

- テスト関連の命名は `test-rule.md`（テストファイル・ヘルパーファイル）／`test-lint-rule.md`（ヘルパー関数）を参照

---

## ディレクトリ構造

```
app/
├── components/
│   ├── atoms/           # 最小単位のUI要素
│   └── molecules/       # atomsを組み合わせた要素
├── feature/
│   └── <機能名>/         # 機能単位のディレクトリ
│       ├── components/  # 機能特有のコンポーネント
│       ├── hooks/       # 機能特有のカスタムhooks
│       ├── types/       # 機能特有の型定義
│       ├── utils/       # 機能特有のユーティリティ
│       └── shared/      # 共有ユーティリティ
├── hooks/               # グローバルhooks
├── utils/               # グローバルユーティリティ
├── css/                 # 色定数・グローバルCSS
└── styles/              # レイアウト定数
```

- **Atomic Design** を採用（atoms / molecules の2段構成）
- 機能単位のコードは `feature/<機能名>/` 配下に集約

---

## TypeScript

- 型が不明な場合は `unknown` を使用、型ガードで絞り込む

```typescript
const parseResponse = (data: unknown): ResponseType => {
  if (!isResponseType(data)) throw new Error('Invalid response');
  return data;
};
```

- コンポーネントは `FC<Props>` パターンで統一
- `type` のプロパティには**必ずコメントで説明を付与**

```typescript
export type AppButtonProps = {
  /** ボタンクリック時のコールバック */
  onClick?: () => void;
  /** アクティブ状態のフラグ */
  isActive?: boolean;
  /** ボタンに表示するラベル文字列 */
  label?: string;
};

export const AppButton: FC<AppButtonProps> = ({ onClick, isActive, label }) => {...};
```

- 型ガード関数（`is〇〇`）を活用

```typescript
export const isUser = (value: Person): value is User => {
  return (value as User).email !== undefined;
};
```

- `tsconfig.json` で `strict: true` を維持
- Union 型で複数のデータ型を表現

---

## 定数

- 固定文字列は **UPPER_SNAKE_CASE** で定数化
- **正規表現リテラルも対象**。マジックナンバー同様に定数化（同一パターンの重複を防ぎ、意図を名前で明示するため）
- 定数はスコープに応じて配置先を使い分け
  - グローバルに使用するものは `app/styles/layoutConstants.ts` または `app/css/color.ts`
  - 機能固有のものは `feature/<機能名>/` 配下に定義

```typescript
// ✅ 良い例
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

EMAIL_PATTERN.test(email);

// ❌ 悪い例
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

---

## スタイリング

- **Tailwind CSS を主流**として使用
- CSS変数（`--primary` 等）を `globals.css` に定義、`tailwind.config.ts` で橋渡し

```typescript
// tailwind.config.ts
colors: {
  baseWhite: 'var(--baseWhite)',
  primary: 'var(--primary)',
}
```

- スタイルはコンポーネント内で `const style = {}` オブジェクトとして定義

```typescript
const style = {
  button: 'bg-baseWhite rounded-lg cursor-pointer border-4 px-2',
  activeButton: 'border-primary',
};
```

- レスポンシブは `md:` ブレークポイントで統一
- 色定数は `app/css/color.ts` に集約
- レイアウト定数は `app/styles/layoutConstants.ts` に集約

---

## コンポーネント設計

- ドロワーは `createPortal` で `document.body` に注入
- アニメーションは **Framer Motion** を使用（`AnimatePresence` + `motion.div`）

```typescript
const variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
};
```

---

## Storybook

- コンポーネントを実装する際は**必ず Storybook（`.stories.tsx`）を実装**
- コンポーネントファイルと同一フォルダに配置（コロケーション）

```typescript
// AppButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { AppButton } from './AppButton';

const meta: Meta<typeof AppButton> = {
  component: AppButton,
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: { label: 'ボタン' },
};
```

---

## Path alias

- `@/` を使用

```typescript
import { AppButton } from '@/app/components/molecules/AppButton';
```

---

## カスタムhooks

- 命名は `use` プリフィックス必須、機能を明確に表現
- 戻り値は**オブジェクト**で返す

```typescript
export const useDisclosure = (): DisclosureReturn => {
  return { isOpen, open, close, toggle };
};
```

- `useCallback` を活用、依存配列を明示
- `useEffect` では必ずクリーンアップ関数を返す

```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [handleResize]);
```

---

## 関数設計

- 設計原則は [[design-rule]]（`shared-rules/design-principles/design-rule.md`）に従う
- 副作用のない純粋関数を推奨
- 引数が多い場合はオブジェクト形式にする

```typescript
// ✅ 良い例（型を named type として切り出す）
type DetermineSwipeDirectionParams = {
  deltaX: number;
  deltaY: number;
  threshold: number;
  disableUpSwipe: boolean;
};

export const determineSwipeDirection = ({
  deltaX,
  deltaY,
  threshold,
  disableUpSwipe,
}: DetermineSwipeDirectionParams): SwipeDirection | null => {...};

// ❌ 悪い例（型をインラインで記述）
export const determineSwipeDirection = ({
  deltaX,
  deltaY,
  threshold,
  disableUpSwipe,
}: {
  deltaX: number;
  deltaY: number;
  threshold: number;
  disableUpSwipe: boolean;
}): SwipeDirection | null => {...};
```

- 複数責務が混在する大きい関数 → 意味のまとまりごとに独立関数へ分離（SRP/SoC の具体適用。定義・観点は [[design-rule]] 参照）

```typescript
// ❌ 悪い例（判定・状態更新・ログ出力が1関数に混在）
const handleTouchEnd = (params: DetermineSwipeDirectionParams): void => {
  const swipeDirection = determineSwipeDirection(params);
  setDirection(swipeDirection);
  console.log(`👆 スワイプ方向: ${swipeDirection}`);
};

// ✅ 良い例（責務ごと分離）
const applySwipeDirection = (swipeDirection: SwipeDirection | null): void => {
  setDirection(swipeDirection);
};

const logSwipeDirection = (swipeDirection: SwipeDirection | null): void => {
  console.log(`👆 スワイプ方向: ${swipeDirection}`);
};

const handleTouchEnd = (params: DetermineSwipeDirectionParams): void => {
  const swipeDirection = determineSwipeDirection(params);
  applySwipeDirection(swipeDirection);
  logSwipeDirection(swipeDirection);
};
```

---

## コメント・デバッグ

- コメントは**日本語のみ**使用
- 関数の説明は TSDOC 形式（`/** */`）で記述

```typescript
/**
 * スワイプ方向を判定する純粋関数
 * deltaX / deltaY と閾値、各方向の無効フラグから方向を返す。
 */
```

- `console.log` には絵文字で状態を示す

```typescript
console.log('🔄 データを取得中...');
console.log('✅ データを取得しました');
```

---

## Linting / Formatting

- ESLint: TypeScript strict + React Hooks + a11y
- Prettier: `semi: true`, `singleQuote: true`, `printWidth: 80`
- Stylelint: Tailwind CSS 設定

---

## テスト

テストの命名・構造・分割・ヘルパー・AAA パターンは `test-rule.md` に分離。テストの実装・レビューは `test-rule.md` 参照。

---

## 関連ルール

- [[coding-lint-rule]]（`shared-rules/coding-conventions/coding-lint-rule.md`） — 機械的に判定可能なルール（本ファイルからの分離先）