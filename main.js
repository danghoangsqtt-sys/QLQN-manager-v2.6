
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');

// Khởi tạo Database SQLite trong thư mục lưu trữ của App
const dbPath = path.join(app.getPath('userData'), 'military_records.db');
const db = new Database(dbPath);

// Tạo cấu trúc bảng nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    data TEXT,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT,
    parentId TEXT
  );
`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Hệ thống Quản lý Quân nhân - QNManager",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'public/icon.png')
  });

  win.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, 'index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Xử lý các lệnh từ React Store qua IPC
ipcMain.handle('db-get-personnel', async () => {
  return db.prepare('SELECT * FROM personnel ORDER BY createdAt DESC').all();
});

ipcMain.handle('db-save-personnel', async (event, { id, data }) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO personnel (id, data, createdAt) VALUES (?, ?, ?)');
  return stmt.run(id, JSON.stringify(data), Date.now());
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
