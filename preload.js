
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- AUTHENTICATION ---
  login: (password) => ipcRenderer.invoke('auth-login', password),
  changePassword: (newPass) => ipcRenderer.invoke('auth-change-password', newPass),
  
  // --- SETTINGS (Lưu cấu hình bền vững) ---
  saveSetting: (payload) => ipcRenderer.invoke('db-save-setting', payload),
  getSetting: (key) => ipcRenderer.invoke('db-get-setting', key),

  // --- QUẢN LÝ QUÂN NHÂN ---
  getPersonnel: (filters) => ipcRenderer.invoke('db-get-personnel', filters),
  savePersonnel: (payload) => ipcRenderer.invoke('db-save-personnel', payload),
  deletePersonnel: (id) => ipcRenderer.invoke('db-delete-personnel', id),
  
  // --- QUẢN LÝ ĐƠN VỊ ---
  getUnits: () => ipcRenderer.invoke('db-get-units'),
  saveUnit: (unit) => ipcRenderer.invoke('db-save-unit', unit),
  deleteUnit: (id) => ipcRenderer.invoke('db-delete-unit', id),

  // --- HỆ THỐNG ---
  getSystemStats: () => ipcRenderer.invoke('db-get-stats'),
  resetDatabase: () => ipcRenderer.invoke('db-reset-all'),
});
