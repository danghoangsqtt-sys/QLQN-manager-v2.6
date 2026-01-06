const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Lấy danh sách nhân sự
  getPersonnel: () => ipcRenderer.invoke('db-get-personnel'),
  
  // Lưu (Thêm mới hoặc Cập nhật) nhân sự
  savePersonnel: (payload) => ipcRenderer.invoke('db-save-personnel', payload),
  
  // Xóa nhân sự (Mới thêm)
  deletePersonnel: (id) => ipcRenderer.invoke('db-delete-personnel', id),
});