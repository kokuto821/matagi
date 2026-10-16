# コーディングルール

機械判定可能ルール（命名規則・`interface`/`any`禁止・export パターン・アロー関数・マジックナンバー定数化）→ `coding-lint-rule.md` 参照。本ファイル = 文脈依存でレビューのみ検出可能な項目を残す。

## 命名規則

- 省略なし完全名使用
- `coordinate` 等 汎用的すぎる名前回避。型あっても意味伝わらない名前は不可。値の意味伝わる名前にする

```typescript
// ✅ 良い例
const touchCoordinate = { x: clientX, y: clientY };

// ❌ 悪い例
const coordinate = { x: clientX, y: clientY };
```

- テスト関連命名 → `test-rule.md`（テストファイル・ヘルパーファイル）／`test-lint-rule.md`（ヘルパー関数）参照

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

- **Atomic Design** 採用（atoms / molecules の2段構成）
- 機能単位コード = `feature/<機能名>/` 配下に集約

---

## TypeScript

- 型不明時 `unknown` 使用、型ガードで絞り込む

```typescript
const parseResponse = (data: unknown): ResponseType => {
  if (!isResponseType(data)) throw new Error('Invalid response');
  return data;
};
```

- コンポーネント = `FC<Props>` パターン統一
- `type` のプロパティ = **必ずコメントで説明付与**

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

- 型ガード関数（`is〇〇`）活用

```typescript
export const isUser = (value: Person): value is User => {
  return (value as User).email !== undefined;
};
```

- `tsconfig.json` `strict: true` 維持
- Union 型で複数データ型表現

---

## 定数

- 固定文字列 = **UPPER_SNAKE_CASE** 定数化
- **正規表現リテラルも対象**。マジックナンバー同様に定数化（同一パターン重複防止、意図を名前で明示）
- 定数 = スコープに応じ配置先使い分け
  - グローバル使用 → `app/styles/layoutConstants.ts` または `app/css/color.ts`
  - 機能固有 → `feature/<機能名>/` 配下定義

```typescript
// ✅ 良い例
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

EMAIL_PATTERN.test(email);

// ❌ 悪い例
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

---

## スタイリング

- **Tailwind CSS 主流**使用
- CSS変数（`--primary` 等）を `globals.css` 定義、`tailwind.config.ts` で橋渡し

```typescript
// tailwind.config.ts
colors: {
  baseWhite: 'var(--baseWhite)',
  primary: 'var(--primary)',
}
```

- スタイル = コンポーネント内 `const style = {}` オブジェクト定義

```typescript
const style = {
  button: 'bg-baseWhite rounded-lg cursor-pointer border-4 px-2',
  activeButton: 'border-primary',
};
```

- レスポンシブ = `md:` ブレークポイント統一
- 色定数 = `app/css/color.ts` に集約
- レイアウト定数 = `app/styles/layoutConstants.ts` に集約

---

## コンポーネント設計

- ドロワー = `createPortal` で `document.body` に注入
- アニメーション = **Framer Motion** 使用（`AnimatePresence` + `motion.div`）

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

- コンポーネント実装時 **必ず Storybook（`.stories.tsx`）実装**
- コンポーネントファイルと同一フォルダ配置（コロケーション）

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

- `@/` 使用

```typescript
import { AppButton } from '@/app/components/molecules/AppButton';
```

---

## カスタムhooks

- 命名 = `use` プリフィックス必須、機能を明確表現
- 戻り値 = **オブジェクト**で返す

```typescript
export const useDisclosure = (): DisclosureReturn => {
  return { isOpen, open, close, toggle };
};
```

- `useCallback` 活用、依存配列明示
- `useEffect` = 必ずクリーンアップ関数を返す

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

- 設計原則 → [[design-rule]]（`shared-rules/design-principles/design-rule.md`）従う
- 副作用なし純粋関数推奨
- 引数多い場合 オブジェクト形式

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

- 複数責務混在の大きい関数 → 意味のまとまりごと独立関数へ分離（SRP/SoC 具体適用。定義・観点 [[design-rule]] 参照）

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

- コメント = **日本語のみ**
- 関数説明 = TSDOC 形式（`/** */`）

```typescript
/**
 * スワイプ方向を判定する純粋関数
 * deltaX / deltaY と閾値、各方向の無効フラグから方向を返す。
 */
```

- `console.log` = 絵文字で状態表示

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

テスト命名・構造・分割・ヘルパー・AAA パターン → `test-rule.md` に分離。テスト実装・レビュー → `test-rule.md` 参照。

---

## 関連ルール

- [[coding-lint-rule]]（`shared-rules/coding-conventions/coding-lint-rule.md`） — 機械判定可能ルール（本ファイルからの分離先）