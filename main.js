const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const fs = require('fs');

// Đảm bảo thư mục dữ liệu tồn tại
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

const dbPath = path.join(userDataPath, 'military_records.db');
let db;

try {
  // Khởi tạo Database
  db = new Database(dbPath, { verbose: isDev ? console.log : null });
  
  // Tối ưu hiệu năng SQLite cho ứng dụng offline
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // Khởi tạo bảng (Schema)
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
} catch (err) {
  console.error('Không thể khởi tạo cơ sở dữ liệu:', err);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Hệ thống Quản lý Quân nhân - QNManager",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Bảo mật: Bật
      nodeIntegration: false  // Bảo mật: Tắt
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

// --- IPC HANDLERS: PERSONNEL (QUÂN NHÂN) ---

ipcMain.handle('db-get-personnel', async () => {
  try {
    // Lấy toàn bộ danh sách quân nhân, sắp xếp mới nhất lên đầu
    return db.prepare('SELECT * FROM personnel ORDER BY createdAt DESC').all();
  } catch (err) {
    console.error('Lỗi truy vấn personnel:', err);
    return [];
  }
});

ipcMain.handle('db-save-personnel', async (event, { id, data }) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO personnel (id, data, createdAt) VALUES (?, ?, ?)');
    return stmt.run(id, JSON.stringify(data), data.createdAt || Date.now());
  } catch (err) {
    console.error('Lỗi lưu personnel:', err);
    throw err;
  }
});

ipcMain.handle('db-delete-personnel', async (event, id) => {
  try {
    const stmt = db.prepare('DELETE FROM personnel WHERE id = ?');
    const info = stmt.run(id);
    console.log(`Đã xóa hồ sơ ID: ${id}, thay đổi: ${info.changes}`);
    return info;
  } catch (err) {
    console.error('Lỗi xóa personnel:', err);
    throw err;
  }
});

// --- IPC HANDLERS: UNITS (ĐƠN VỊ) - MỚI BỔ SUNG ---
// Khắc phục lỗi dữ liệu không đồng bộ giữa LocalStorage và SQLite

ipcMain.handle('db-get-units', async () => {
  try {
    return db.prepare('SELECT * FROM units').all();
  } catch (err) {
    console.error('Lỗi truy vấn units:', err);
    return [];
  }
});

ipcMain.handle('db-save-unit', async (event, unit) => {
  try {
    // unit bao gồm { id, name, parentId }
    const stmt = db.prepare('INSERT OR REPLACE INTO units (id, name, parentId) VALUES (?, ?, ?)');
    const info = stmt.run(unit.id, unit.name, unit.parentId);
    return info;
  } catch (err) {
    console.error('Lỗi lưu unit:', err);
    throw err;
  }
});

ipcMain.handle('db-delete-unit', async (event, id) => {
  try {
    const stmt = db.prepare('DELETE FROM units WHERE id = ?');
    const info = stmt.run(id);
    return info;
  } catch (err) {
    console.error('Lỗi xóa unit:', err);
    throw err;
  }
});

// --- IPC HANDLERS: SYSTEM (HỆ THỐNG) ---

ipcMain.handle('db-reset-all', async () => {
  try {
    // Xóa sạch dữ liệu (Dùng cho tính năng Reset trong Settings)
    const transaction = db.transaction(() => {
        db.prepare('DELETE FROM personnel').run();
        db.prepare('DELETE FROM units').run();
    });
    transaction();
    return { success: true };
  } catch (err) {
    console.error('Lỗi reset database:', err);
    throw err;
  }
});

// --- APP LIFECYCLE ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});