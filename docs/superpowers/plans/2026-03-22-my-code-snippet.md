# My Code Snippet Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GROWIエディタのツールバーにボタンを追加し、Markdown/HTMLスニペットをlocalStorageで管理・クリップボードにコピーできるプラグインを作成する。

**Architecture:** 参考リポジトリ (growi-plugin-xls-to-table) と同じ構成。`client-entry.tsx` でプラグイン登録・ツールバーボタン挿入、`src/storage.ts` でlocalStorage CRUD、`src/Modal.tsx` でReactモーダルUI。

**Tech Stack:** React 18, TypeScript, Vite, @growi/plugin-kit

**Spec:** `docs/superpowers/specs/2026-03-22-my-code-snippet-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts, growiPlugin config |
| `tsconfig.json` | TypeScript compiler options |
| `vite.config.ts` | Vite build configuration |
| `.gitignore` | Ignore node_modules, dist |
| `src/storage.ts` | localStorage CRUD for Snippet[] |
| `src/Modal.tsx` | React modal UI (list + form views) |
| `client-entry.tsx` | Plugin registration, toolbar button, React mount |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "growi-plugin-my-code-snippet",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc && vite build",
    "build:watch": "vite build --watch",
    "preview": "vite preview"
  },
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
    "vite": "^5.4.20"
  },
  "growiPlugin": {
    "schemaVersion": "4",
    "types": [
      "script"
    ]
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["client-entry.tsx", "src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      input: 'client-entry.tsx',
      preserveEntrySignatures: 'strict',
    },
  },
});
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet, should succeed).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts .gitignore
git commit -m "chore: scaffold project with Vite, React, TypeScript"
```

---

### Task 2: Storage Layer (`src/storage.ts`)

**Files:**
- Create: `src/storage.ts`

- [ ] **Step 1: Create storage module**

```typescript
const STORAGE_KEY = 'growi-my-code-snippets';

export interface Snippet {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36);
}

export function getSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(snippets: Snippet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

export function addSnippet(title: string, content: string): Snippet {
  const now = Date.now();
  const snippet: Snippet = {
    id: generateId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  const snippets = getSnippets();
  snippets.unshift(snippet);
  saveAll(snippets);
  return snippet;
}

export function updateSnippet(id: string, title: string, content: string): void {
  const snippets = getSnippets();
  const index = snippets.findIndex((s) => s.id === id);
  if (index === -1) return;
  snippets[index] = {
    ...snippets[index],
    title,
    content,
    updatedAt: Date.now(),
  };
  saveAll(snippets);
}

export function deleteSnippet(id: string): void {
  const snippets = getSnippets().filter((s) => s.id !== id);
  saveAll(snippets);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/storage.ts
git commit -m "feat: add localStorage storage layer for snippets"
```

---

### Task 3: Modal Component (`src/Modal.tsx`)

**Files:**
- Create: `src/Modal.tsx`

- [ ] **Step 1: Create Modal component**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { getSnippets, addSnippet, updateSnippet, deleteSnippet, type Snippet } from './storage';

type View = 'list' | 'form';

interface ModalProps {
  onClose: () => void;
}

export function SnippetModal({ onClose }: ModalProps) {
  const [view, setView] = useState<View>('list');
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSnippets = useCallback(() => {
    setSnippets(getSnippets());
  }, []);

  useEffect(() => {
    refreshSnippets();
  }, [refreshSnippets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNew = () => {
    setEditingSnippet(null);
    setTitle('');
    setContent('');
    setError(null);
    setView('form');
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setTitle(snippet.title);
    setContent(snippet.content);
    setError(null);
    setView('form');
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    try {
      if (editingSnippet) {
        updateSnippet(editingSnippet.id, title.trim(), content.trim());
      } else {
        addSnippet(title.trim(), content.trim());
      }
      refreshSnippets();
      setView('list');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        setError('ストレージの容量が不足しています。不要なスニペットを削除してください。');
      } else {
        setError('保存に失敗しました。');
      }
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteSnippet(id);
      refreshSnippets();
    } catch {
      setError('削除に失敗しました。');
    }
  };

  const handleCopy = async (snippet: Snippet) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(snippet.content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = snippet.content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('コピーに失敗しました。');
    }
  };

  const handleCancel = () => {
    setView('list');
    setError(null);
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {view === 'list' ? (
          <>
            <div style={headerStyle}>
              <h5 style={{ margin: 0 }}>My Code Snippets</h5>
              <div>
                <button style={btnPrimaryStyle} onClick={handleNew}>新規登録</button>
                <button style={btnCloseStyle} onClick={onClose}>&times;</button>
              </div>
            </div>
            <div style={bodyStyle}>
              {error && <div style={errorStyle}>{error}</div>}
              {snippets.length === 0 ? (
                <p style={{ color: 'var(--bs-secondary-color, #6c757d)', textAlign: 'center', padding: '2rem 0' }}>
                  スニペットがありません
                </p>
              ) : (
                snippets.map((s) => (
                  <div key={s.id} style={snippetRowStyle}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button style={btnSmStyle} onClick={() => handleCopy(s)}>
                        {copiedId === s.id ? 'コピーしました!' : 'コピー'}
                      </button>
                      <button style={btnSmStyle} onClick={() => handleEdit(s)}>編集</button>
                      <button style={btnSmDangerStyle} onClick={() => handleDelete(s.id)}>削除</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div style={headerStyle}>
              <button style={btnBackStyle} onClick={handleCancel}>&larr; 戻る</button>
              <h5 style={{ margin: 0 }}>{editingSnippet ? '編集' : '新規登録'}</h5>
              <div />
            </div>
            <div style={bodyStyle}>
              {error && <div style={errorStyle}>{error}</div>}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  placeholder="スニペット名"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>コード</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={textareaStyle}
                  placeholder="Markdown / HTML コード"
                  rows={12}
                />
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondaryStyle} onClick={handleCancel}>キャンセル</button>
              <button
                style={btnPrimaryStyle}
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
              >
                保存
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Styles ---

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10500,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--bs-body-bg, #fff)',
  color: 'var(--bs-body-color, #212529)',
  borderRadius: '8px',
  width: '90vw',
  maxWidth: '900px',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px',
  overflowY: 'auto',
  flex: 1,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '12px 16px',
  borderTop: '1px solid var(--bs-border-color, #dee2e6)',
};

const snippetRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: 'bold',
  fontSize: '0.875rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid var(--bs-border-color, #dee2e6)',
  borderRadius: '4px',
  backgroundColor: 'var(--bs-body-bg, #fff)',
  color: 'var(--bs-body-color, #212529)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: 'monospace',
  resize: 'vertical',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#0d6efd',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: '1px solid var(--bs-border-color, #dee2e6)',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  color: 'var(--bs-body-color, #212529)',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const btnCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'var(--bs-body-color, #212529)',
  marginLeft: '8px',
  lineHeight: 1,
};

const btnSmStyle: React.CSSProperties = {
  padding: '2px 8px',
  border: '1px solid var(--bs-border-color, #dee2e6)',
  borderRadius: '4px',
  backgroundColor: 'var(--bs-tertiary-bg, #f8f9fa)',
  color: 'var(--bs-body-color, #212529)',
  cursor: 'pointer',
  fontSize: '0.75rem',
};

const btnBackStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--bs-body-color, #212529)',
  fontSize: '0.875rem',
  padding: '4px 8px',
};

const btnSmDangerStyle: React.CSSProperties = {
  ...btnSmStyle,
  color: '#dc3545',
  borderColor: '#dc3545',
};

const errorStyle: React.CSSProperties = {
  padding: '8px 12px',
  marginBottom: '12px',
  backgroundColor: '#f8d7da',
  color: '#842029',
  borderRadius: '4px',
  fontSize: '0.875rem',
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/Modal.tsx
git commit -m "feat: add snippet modal component with list and form views"
```

---

### Task 4: Plugin Entry Point (`client-entry.tsx`)

**Files:**
- Create: `client-entry.tsx`

- [ ] **Step 1: Create client-entry.tsx**

```tsx
import { createRoot, type Root } from 'react-dom/client';
import { SnippetModal } from './src/Modal';

let modalRoot: Root | null = null;
let container: HTMLDivElement | null = null;
let toolbarButton: HTMLElement | null = null;
let isListening = false;

function showModal() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'growi-snippet-modal-container';
    document.body.appendChild(container);
  }
  if (!modalRoot) {
    modalRoot = createRoot(container);
  }
  modalRoot.render(<SnippetModal onClose={hideModal} />);
}

function hideModal() {
  if (modalRoot) {
    modalRoot.render(<></>);
  }
}

function createToolbarButton(): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'btn btn-toolbar-button';
  btn.type = 'button';
  btn.title = 'My Code Snippets';
  btn.innerHTML = '<span class="material-symbols-outlined">content_paste</span>';
  btn.addEventListener('click', showModal);
  return btn;
}

function ensureToolbarButton(retries = 20): void {
  const toolbar = document.querySelector('.cm-editor .cm-panel-eos-toolbar');
  if (!toolbar) {
    if (retries > 0) {
      setTimeout(() => ensureToolbarButton(retries - 1), 200);
    }
    return;
  }
  if (toolbarButton && toolbar.contains(toolbarButton)) return;
  toolbarButton = createToolbarButton();
  toolbar.appendChild(toolbarButton);
}

function onNavigate(): void {
  const hash = window.location.hash;
  if (hash.includes('edit')) {
    ensureToolbarButton();
  }
}

function activate(): void {
  if (isListening) return;
  isListening = true;

  onNavigate();

  if (window.navigation) {
    window.navigation.addEventListener('navigatesuccess', onNavigate);
  }
}

function deactivate(): void {
  isListening = false;

  if (window.navigation) {
    window.navigation.removeEventListener('navigatesuccess', onNavigate);
  }

  if (toolbarButton && toolbarButton.parentElement) {
    toolbarButton.parentElement.removeChild(toolbarButton);
    toolbarButton = null;
  }

  if (modalRoot) {
    modalRoot.unmount();
    modalRoot = null;
  }

  if (container && container.parentElement) {
    container.parentElement.removeChild(container);
    container = null;
  }
}

if (!window.pluginActivators) {
  window.pluginActivators = {};
}

window.pluginActivators['growi-plugin-my-code-snippet'] = {
  activate,
  deactivate,
};
```

- [ ] **Step 2: Add global type declarations**

Create `src/global.d.ts`:

```typescript
interface PluginActivator {
  activate: () => void;
  deactivate: () => void;
}

interface Window {
  pluginActivators?: Record<string, PluginActivator>;
  navigation?: {
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Verify Vite builds**

Run: `npx vite build`
Expected: Build succeeds, `dist/` directory created with manifest.json and assets.

- [ ] **Step 5: Commit**

```bash
git add client-entry.tsx src/global.d.ts
git commit -m "feat: add plugin entry point with toolbar button injection"
```

---

### Task 5: Build Verification and Final Commit

**Files:**
- Verify: all files

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`
Expected: Build succeeds with no TypeScript or Vite errors.

- [ ] **Step 2: Verify dist output**

Run: `ls dist/.vite/manifest.json && ls dist/assets/`
Expected: `manifest.json` exists, `client-entry-*.js` asset exists.

- [ ] **Step 3: Verify no external URLs in built output**

Run: `grep -rE 'https?://' dist/assets/ || echo "No external URLs found"`
Expected: No external URLs found (or only React internal development-mode warnings which are stripped in production).

- [ ] **Step 4: Final commit if any changes**

```bash
git status
# If dist/ should be committed for deployment:
git add dist/
git commit -m "chore: add built output for deployment"
```
