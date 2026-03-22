# growi-plugin-my-code-snippet Design Spec

## Overview

GROWIのエディタ編集モードにツールバーボタンを追加し、ユーザーが登録したMarkdown/HTMLスニペットをモーダルから管理・クリップボードにコピーできるプラグイン。

## Project Structure

```
growi-plugin-my-code-snippet/
├── src/
│   ├── Modal.tsx          # モーダルUI（一覧 + 登録/編集フォーム）
│   └── storage.ts         # localStorage CRUD操作
├── client-entry.tsx       # プラグインエントリポイント
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

- React 18 + TypeScript + Vite
- `@growi/plugin-kit` 使用
- `growiPlugin: { schemaVersion: "4", types: ["script"] }`

## Data Model

```typescript
interface Snippet {
  id: string;          // crypto.randomUUID() で生成
  title: string;       // スニペット名
  content: string;     // Markdown/HTMLコード
  createdAt: number;   // 作成日時（timestamp）
  updatedAt: number;   // 更新日時（timestamp）
}
```

### Storage (`storage.ts`)

- **保存先**: ブラウザの localStorage
- **キー**: `growi-my-code-snippets`
- **値**: `Snippet[]` のJSON配列
- **関数**:
  - `getSnippets(): Snippet[]` — 全スニペット取得
  - `saveSnippet(snippet: Snippet): void` — 新規保存
  - `updateSnippet(snippet: Snippet): void` — 更新
  - `deleteSnippet(id: string): void` — 削除
- **エラーハンドリング**: try-catchでlocalStorage不可時に空配列を返す

## UI Design

### モーダル — 単一モーダル内で2画面を切り替え

#### 画面1: 一覧表示（デフォルト）

- **ヘッダー**: タイトル「My Code Snippets」+ 「新規登録」ボタン + 閉じるボタン(x)
- **ボディ**: スニペット一覧（新しい順）
  - 各行: タイトル + 「コピー」ボタン + 「編集」ボタン + 「削除」ボタン
  - コピー成功時「コピーしました!」のフィードバック（数秒で消える）
  - 削除は確認なしで即削除
- **空状態**: 「スニペットがありません」メッセージ

#### 画面2: 登録/編集フォーム

- **ヘッダー**: 「新規登録」or「編集」+ 戻るボタン
- **ボディ**:
  - タイトル入力欄（テキスト）
  - コード入力欄（textarea、等幅フォント）
- **フッター**: 「キャンセル」ボタン + 「保存」ボタン

### スタイル

- Bootstrap CSS変数を使用しGROWIのテーマ（ライト/ダーク）に追従
- `--bs-body-bg`, `--bs-body-color`, `--bs-border-color`, `--bs-tertiary-bg`
- モーダル: max-width 900px, max-height 70vh, 中央配置
- バックドロップ: rgba(0,0,0,0.5)

## Entry Point (`client-entry.tsx`)

- `window.pluginActivators` に登録
- `activate()`:
  - Navigation APIで `#edit` を検知
  - CodeMirrorツールバーにボタン追加（ポーリング20回、200ms間隔）
  - ボタンアイコン: Material Symbols `content_paste`
  - クリック → Reactでモーダルをマウント・表示
- `deactivate()`:
  - イベントリスナー・DOM要素のクリーンアップ

## Technical Decisions

- **保存先: localStorage** — サーバー不要でシンプル。端末ごとに別管理となるトレードオフあり
- **CodeMirrorに非依存** — コピーのみでエディタ直接挿入しない。依存を最小限に
- **参考リポジトリ (growi-plugin-xls-to-table) と同じプラグイン構成** — エントリポイント、ツールバー挿入、ライフサイクル管理は同じパターン
