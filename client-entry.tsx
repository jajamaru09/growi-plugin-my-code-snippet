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
