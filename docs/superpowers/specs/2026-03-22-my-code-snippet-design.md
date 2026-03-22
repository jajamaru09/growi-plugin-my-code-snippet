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

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@growi/plugin-kit": "^1.1.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- `growiPlugin: { schemaVersion: "4", types: ["script"] }`

## Build Configuration

### vite.config.ts

- React plugin (`@vitejs/plugin-react`)
- Entry: `client-entry.tsx`
- `rollupOptions.preserveEntrySignatures: 'strict'`
- `manifest: true`

### tsconfig.json

- `target: "ES2020"`, `module: "ESNext"`, `moduleResolution: "bundler"`
- `jsx: "react-jsx"`, `strict: true`, `noEmit: true`
- `lib: ["ES2020", "DOM", "DOM.Iterable"]`

### .gitignore

- `node_modules/`, `dist/`

## Data Model

```typescript
interface Snippet {
  id: string;          // crypto.randomUUID() で生成（非セキュアコンテキストではfallback）
  title: string;       // スニペット名
  content: string;     // Markdown/HTMLコード
  createdAt: number;   // 作成日時（timestamp）
  updatedAt: number;   // 更新日時（timestamp）
}
```

ID生成: `crypto.randomUUID()` を優先し、利用不可時は `Date.now().toString(36) + Math.random().toString(36)` にfallback。

## Storage (`storage.ts`)

- **保存先**: ブラウザの localStorage
- **キー**: `growi-my-code-snippets`
- **値**: `Snippet[]` のJSON配列
- **関数**:
  - `getSnippets(): Snippet[]` — 全スニペット取得
  - `addSnippet(snippet: Snippet): void` — 新規作成（idで重複チェックなし、常に追加）
  - `updateSnippet(snippet: Snippet): void` — 既存スニペットのidで検索し上書き更新
  - `deleteSnippet(id: string): void` — 指定idのスニペットを削除
- **エラーハンドリング**:
  - try-catchでlocalStorage不可時に空配列を返す
  - `QuotaExceededError` 時はユーザーにエラーメッセージを表示

## UI Design

### モーダル — 単一モーダル内で2画面を切り替え

#### 画面1: 一覧表示（デフォルト）

- **ヘッダー**: タイトル「My Code Snippets」+ 「新規登録」ボタン + 閉じるボタン(x)
- **ボディ**: スニペット一覧（新しい順）、リスト部分は `overflow-y: auto` でスクロール可能
  - 各行: タイトル + 「コピー」ボタン + 「編集」ボタン + 「削除」ボタン
  - コピー成功時「コピーしました!」のフィードバック（2秒後に消える）
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
- Escapeキーでモーダルを閉じる

### クリップボード

- `navigator.clipboard.writeText()` を優先
- 利用不可時は `document.execCommand('copy')` にfallback

## Entry Point (`client-entry.tsx`)

- `window.pluginActivators` に登録
- `activate()`:
  - Navigation APIで `#edit` を検知
  - CodeMirrorツールバーにボタン追加（ポーリング20回、200ms間隔）
  - ボタンアイコン: Material Symbols `content_paste`
  - クリック → Reactでモーダルをマウント・表示
- `deactivate()`:
  - Navigation APIイベントリスナーの削除
  - ツールバーボタンのDOM要素を削除
  - Reactモーダルコンテナのアンマウント・削除

## Technical Decisions

- **保存先: localStorage** — サーバー不要でシンプル。端末ごとに別管理となるトレードオフあり
- **CodeMirrorに非依存** — コピーのみでエディタ直接挿入しない。依存を最小限に
- **参考リポジトリ (growi-plugin-xls-to-table) と同じプラグイン構成** — エントリポイント、ツールバー挿入、ライフサイクル管理は同じパターン

## Out of Scope (v1)

- スニペットのインポート/エクスポート機能
- タイトル検索/フィルタリング
- タグ/カテゴリによる分類
