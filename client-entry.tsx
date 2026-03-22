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
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined fs-5';
  icon.textContent = 'content_paste';
  btn.appendChild(icon);
  btn.addEventListener('click', showModal);
  return btn;
}

function addToolbarButton(): void {
  if (toolbarButton && document.contains(toolbarButton)) return;

  const toolbar = document.querySelector(
    '._codemirror-editor-toolbar_q11bm_1 .simplebar-content .d-flex.gap-2'
  );
  if (!toolbar) return;

  toolbarButton = createToolbarButton();
  toolbar.appendChild(toolbarButton);
}

function waitForToolbar(): void {
  const maxAttempts = 20;
  let attempts = 0;

  const tryAdd = () => {
    attempts++;
    const toolbar = document.querySelector(
      '._codemirror-editor-toolbar_q11bm_1 .simplebar-content .d-flex.gap-2'
    );
    if (toolbar) {
      addToolbarButton();
    } else if (attempts < maxAttempts) {
      setTimeout(tryAdd, 200);
    }
  };

  tryAdd();
}

function onNavigate(): void {
  const hash = window.location.hash;
  if (hash.includes('edit')) {
    waitForToolbar();
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
