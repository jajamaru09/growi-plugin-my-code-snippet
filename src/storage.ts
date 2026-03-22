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
