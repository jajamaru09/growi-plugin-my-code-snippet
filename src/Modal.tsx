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
  backgroundColor: 'var(--bs-danger-bg-subtle, #f8d7da)',
  color: 'var(--bs-danger-text-emphasis, #842029)',
  borderRadius: '4px',
  fontSize: '0.875rem',
};
