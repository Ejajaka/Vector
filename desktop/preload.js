const { contextBridge, ipcRenderer } = require('electron');

/**
 * Deliberately tiny surface: the renderer only learns that it is running
 * inside the desktop shell and can listen for menu-driven navigation.
 */
contextBridge.exposeInMainWorld('vectorDesktop', {
  isDesktop: true,
  platform: process.platform,
  onNavigate: (callback) => {
    const handler = (_event, tab) => callback(tab);
    ipcRenderer.on('vector:navigate', handler);
    return () => ipcRenderer.removeListener('vector:navigate', handler);
  },
});
