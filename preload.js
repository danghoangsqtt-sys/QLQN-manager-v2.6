const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- AUTHENTICATION (BẢO MẬT - MỚI) ---
  // Gọi xuống main.js để kiểm tra hash mật khẩu
  login: (password) => ipcRenderer.invoke('auth-login', password),
  changePassword: (newPassword) => ipcRenderer.invoke('auth-change-password', newPassword),

  // --- QUẢN LÝ QUÂN NHÂN ---
  // Cho phép truyền filters xuống để SQL xử lý
  getPersonnel: (filters) => ipcRenderer.invoke('db-get-personnel', filters),
  savePersonnel: (payload) => ipcRenderer.invoke('db-save-personnel', payload),
  deletePersonnel: (id) => ipcRenderer.invoke('db-delete-personnel', id),
  
  // --- QUẢN LÝ ĐƠN VỊ ---
  getUnits: () => ipcRenderer.invoke('db-get-units'),
  saveUnit: (unit) => ipcRenderer.invoke('db-save-unit', unit),
  deleteUnit: (id) => ipcRenderer.invoke('db-delete-unit', id),

  // --- HỆ THỐNG ---
  resetDatabase: () => ipcRenderer.invoke('db-reset-all'),
});