
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPersonnel: () => ipcRenderer.invoke('db-get-personnel'),
  savePersonnel: (payload) => ipcRenderer.invoke('db-save-personnel', payload),
  // Thêm các hàm khác tương tự cho units, logs...
});
