const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] API exposed.');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth (Vẫn cần thiết)
  login: (p) => ipcRenderer.invoke('auth:login', p),
  changePassword: (p) => ipcRenderer.invoke('auth:changePassword', p),
  
  // System Utils
  getStats: () => ipcRenderer.invoke('db:getStats'),
  saveSetting: (p) => ipcRenderer.invoke('db:saveSetting', p),
  getSetting: (k) => ipcRenderer.invoke('db:getSetting', k),
  updateFromFile: () => ipcRenderer.invoke('system:updateFromFile')
});