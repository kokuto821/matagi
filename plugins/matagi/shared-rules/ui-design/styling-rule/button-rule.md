## ボタン規約

### Variant（用途で使い分ける）

| variant   | 用途                           |
|-----------|-------------------------------|
| primary   | メインアクション（保存・決定）    |
| secondary | サブアクション（キャンセル・戻る）|
| danger    | 削除・取り消し不可の操作         |
| ghost     | ツールバー内のアイコンボタン等    |

### Size

| size | paddingクラス | フォントサイズ | 用途           |
|------|-------------|-------------|----------------|
| sm   | px-2 py-1   | text-sm     | タグ横・密なUI内 |
| md   | px-4 py-2   | text-base   | 標準（デフォルト）|
| lg   | px-6 py-4   | text-lg     | ページ主要CTA   |

### 実装パターン

const buttonStyle = {
  base: 'rounded-lg cursor-pointer font-medium transition-colors',
  primary:   '...',  // プロジェクトのCSS変数で定義
  secondary: '...',
  danger:    '...',
  ghost:     '...',
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-4 text-lg',
};

### ルール
- `base` は必ず全ボタンに付与
- variantとsizeを組み合わせる：
  `${buttonStyle.base} ${buttonStyle.primary} ${buttonStyle.md}`
- hover・disabled・active状態=Tailwind修飾子で表現、
  インラインstyleは使わない
- disabled時は必ず `opacity-50 cursor-not-allowed` を付与
- モバイルでは44px*44px以上確保