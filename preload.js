const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] API exposed.');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth (Vẫn giữ để xử lý đăng nhập an toàn)
  login: (p) => ipcRenderer.invoke('auth:login', p),
  changePassword: (p) => ipcRenderer.invoke('auth:changePassword', p),
  
  // System Utils (Logic update phiên bản)
  updateFromFile: () => ipcRenderer.invoke('system:updateFromFile')
  
  // Đã xóa getStats, saveSetting, getSetting vì UI sẽ gọi trực tiếp DB Dexie
});