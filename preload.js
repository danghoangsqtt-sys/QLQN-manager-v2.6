const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- QUẢN LÝ QUÂN NHÂN ---
  getPersonnel: () => ipcRenderer.invoke('db-get-personnel'),
  savePersonnel: (payload) => ipcRenderer.invoke('db-save-personnel', payload),
  deletePersonnel: (id) => ipcRenderer.invoke('db-delete-personnel', id),
  
  // --- QUẢN LÝ ĐƠN VỊ (MỚI BỔ SUNG) ---
  getUnits: () => ipcRenderer.invoke('db-get-units'),
  saveUnit: (unit) => ipcRenderer.invoke('db-save-unit', unit),
  deleteUnit: (id) => ipcRenderer.invoke('db-delete-unit', id),

  // --- HỆ THỐNG ---
  resetDatabase: () => ipcRenderer.invoke('db-reset-all'),
});