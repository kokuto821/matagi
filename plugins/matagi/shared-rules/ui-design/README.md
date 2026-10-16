# ui-design ルール索引

UI デザインルールの**索引（ルーター）**。ルールは多数ファイルに分割。全部は読み込まず、**まず索引を読み、扱う関心事に該当するファイルだけ読む**。

対象: 実プロジェクト（React / Tailwind 等）のフロントエンド実装。

## 全体構成

```
ui-design/
├── UI哲学.md                  ← 思想（なぜ・何を美しいとするか）
├── architecture/             ← コンポーネントの分類・配置方針
├── component/                ← コンポーネント別ルール（button / edit / view）
│   └── template-ui.md        ← 新規コンポーネントの雛形
└── styling-rule/             ← 全コンポーネント共通の見た目ルール
```

思想 → アーキテクチャ → コンポーネント → スタイリング、の4層構造。上位層で「方針」、下位層で「具体」を定義。

## 利用ガイド（読む順序）

1. **方針確認**: `UI哲学.md` と `architecture/ui-architecture.md` で思想と分類（button / edit / view）を把握。
2. **コンポーネント別**: 扱う UI に該当する下の索引テーブルからファイルを1つ読む。
3. **スタイリング適用**: `styling-rule/` で配色（70/25/5・コントラスト）・余白・角丸を適用。

## 共通必読（どのコンポーネントでも適用）

| 関心事 | ファイル |
|--------|----------|
| 思想・原則 | `UI哲学.md` |
| 分類・配置方針 | `architecture/ui-architecture.md` |
| 配色（70/25/5・コントラスト） | `styling-rule/color.md` |
| 余白・角丸（`rounded-lg`/`-full`/`-xl`、禁止 `rounded-md`/`-sm`/`-3xl`） | `styling-rule/space-and-radius.md` |
| ボタン実装（variant / size / CSS） | `styling-rule/button-rule.md` |
| レイアウト改善（50項目） | `styling-rule/improve-layout.md` |
| UX・文言・アニメーション改善（40項目） | `styling-rule/improve-ui.md` |

## コンポーネント索引

### button — 操作・意思決定（`component/button/`）

| コンポーネント | ファイル |
|----------------|----------|
| ボタン | `component/button/button.md` |
| モーダル | `component/button/modal.md` |
| トグル / スイッチ | `component/button/toggle-switch.md` |
| タブ | `component/button/tab.md` |
| テキストリンク | `component/button/text-link.md` |
| ページャー / ページカウンター | `component/button/pager-and-pagecounter.md` |
| パンくずリスト | `component/button/pankuzu-list.md` |

### edit — 入力・編集（`component/edit/`）

| コンポーネント | ファイル |
|----------------|----------|
| 入力欄（1行） | `component/edit/input.md` |
| テキストエリア（複数行） | `component/edit/text-area.md` |
| セレクトボックス | `component/edit/select-box.md` |
| マルチセレクトボックス | `component/edit/multi-select-box.md` |
| コンボボックス（絞り込み付き） | `component/edit/combo-box.md` |
| デートピッカー | `component/edit/date-picker.md` |
| カウンター / スライダー | `component/edit/counter-and-slider.md` |
| プレースホルダー | `component/edit/place-holder.md` |

### view — 表示・閲覧（`component/view/`）

| コンポーネント | ファイル |
|----------------|----------|
| ヘッダー（アプリ共通） | `component/view/header.md` |
| ページヘッダー | `component/view/page-header.md` |
| 見出し | `component/view/midashi.md` |
| バッジ | `component/view/badge.md` |
| メッセージ / アラート | `component/view/message-alert.md` |
| トースト | `component/view/toast.md` |
| ツールチップ | `component/view/tooltip.md` |
| リスト / カード | `component/view/list-and-card.md` |
| テーブル | `component/view/table.md` |
| 定義リスト | `component/view/teigi-list.md` |
| アコーディオン | `component/view/accordion.md` |
| ステッパー | `component/view/stepper.md` |
| ローディング | `component/view/loading.md` |
| ステータス / チップ | `component/view/status-and-tip.md` |
| ドロップダウン | `component/view/drop-down.md` |
| 広告バナー | `component/view/ad-banner.md` |
| エラーページ | `component/view/error-page.md` |
| ナビゲーション（PC） | `component/view/navigation/navigation-pc.md` |
| ナビゲーション（モバイル） | `component/view/navigation/navigation-mobile.md` |

### 雛形

| 用途 | ファイル |
|------|----------|
| 新規コンポーネントの雛形 | `component/template-ui.md` |
