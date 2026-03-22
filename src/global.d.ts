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
