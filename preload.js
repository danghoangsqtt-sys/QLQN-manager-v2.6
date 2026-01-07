
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Script is running and exposing API...');

// Expose ra window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (p) => ipcRenderer.invoke('auth:login', p),
  changePassword: (p) => ipcRenderer.invoke('auth:changePassword', p),
  
  // Personnel
  getPersonnel: (f) => ipcRenderer.invoke('db:getPersonnel', f),
  savePersonnel: (p) => ipcRenderer.invoke('db:savePersonnel', p),
  deletePersonnel: (id) => ipcRenderer.invoke('db:deletePersonnel', id),
  
  // Units
  getUnits: () => ipcRenderer.invoke('db:getUnits'),
  saveUnit: (u) => ipcRenderer.invoke('db:saveUnit', u),
  deleteUnit: (id) => ipcRenderer.invoke('db:deleteUnit', id),
  
  // System
  getStats: () => ipcRenderer.invoke('db:getStats'),
  getSystemStats: () => ipcRenderer.invoke('db:getStats'),
  resetDatabase: () => ipcRenderer.invoke('db:reset'),
  saveSetting: (p) => ipcRenderer.invoke('db:saveSetting', p),
  getSetting: (k) => ipcRenderer.invoke('db:getSetting', k)
});
