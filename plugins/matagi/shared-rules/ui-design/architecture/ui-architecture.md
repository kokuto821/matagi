# コンポーネント設計思想
Interaction-driven component architecture(インタラクション責務ベースの分類)

個人で考えた思想

## ディレクトリ構造

種類別とコロケーションの組み合わせ構造。

components/
  button/          ← 意思決定・アクション起動
    PrimaryButton/
      PrimaryButton.tsx
      PrimaryButton.module.css
      PrimaryButton.stories.tsx
    IconButton/
      IconButton.tsx
      IconButton.module.css
  edit/            ← 情報の入力・編集
    TextInput/
      TextInput.tsx
      TextInput.module.css
    SelectInput/
      SelectInput.tsx
  view/            ← 表示のみ・読み取り専用
    Badge/
      Badge.tsx
    Avatar/
      Avatar.tsx

pages/             ← React Router使用時、ページ固有コンポーネント
  Dashboard/
    DashboardChart/
    DashboardSummary/

features/          ← React Router非使用時、ドメイン固有コンポーネント
  dashboard/
  settings/

layouts/
hooks/
utils/

## 分類の3本柱

分類軸はユーザーの責務（見た目・大きさではない）

種類責務例button意思決定・アクション起動PrimaryButton, IconButton, Toggleedit情報の入力・編集TextInput, SelectInput, Checkbox, DatePickerview表示のみ・読み取り専用Badge, Avatar, ProgressBar, Table

## 境界はファジーでいい、重心で判断

両方の性質を持つコンポーネントは「実際の使われ方の重心」で分類。

コンポーネント分類理由TogglebuttonON/OFFの意思決定がメインCheckboxeditフォーム内での値選択がメインTableview基本は表示、編集機能は別コンポーネントが担うEditableTableedit編集がメインの用途

## 実装での判断基準: `<button>` 要素の有無

重心判断で迷う場合の実務基準。

- コンポーネントが `<button>` 要素（クリックでアクションを起こす操作）を含むなら `button` に分類。表示が主目的に見えても、ユーザーが操作してアクションを起こす要素を持つ時点でアクション起動の責務を負う。
  - 例: ヘッダー（戻る/閉じるボタンを持つ）、カード（ストック/削除ボタンを持つ）、リスト項目（選択ボタンを持つ）は `button`。
- `<button>` なしで表示のみなら `view`。
- `<button>` 要素ではなく `div` + `role="button"` など擬似ボタンの場合は重心で判断（表示が主体なら `view`）。

## コロケーションで関連ファイルを近くに置く

コンポーネント関連ファイル（tsx・css・stories・test）は同一フォルダに集約。

## 共通 vs ページ固有の判断軸

「他のページ・機能でも使うか？」で判断する。


Yes → components/
No（React Router使用時） → pages/
No（React Router非使用時） → features/

## components の独立性と features への切り出し

`components/` は「独立した汎用部品」に保つ。判断軸:

- 他の自作コンポーネントに依存しない、または汎用基礎部品（Text / Icon など）のみに
  依存する汎用UI → `components/<button|edit|view>/`
- 特定ドメインの概念・データに依存する、または複数のコンポーネントを組み合わせた
  合成コンポーネント → `features/<domain>/`

「他のページでも使うか」に加え「他の自作コンポーネントを組み合わせているか
（独立しているか）」も切り出しの判断材料。

## 合成の方針: children化 vs データ駆動

- 子を固定的に並べる**レイアウトの箱**は、子を直接ハードコードせず `children` / slot で
  受け取る。具体的な中身は利用側（features）で組み立て。箱自体は汎用部品として
  `components/` に保てる。
- **List / Lane 系**（data 配列を受けて `map` で項目を生成するもの）は children 化せず、
  データ駆動のまま維持（ソート・フィルタ等の利点を保つため）。