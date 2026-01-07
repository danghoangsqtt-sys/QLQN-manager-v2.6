const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');

const PASSWORD_SALT = 'DHsystem_Salt_2026';

// ---------- PATH CONFIG ----------
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'du_lieu_quan_nhan_v5.db');

let db;

// ---------- HELPERS ----------
function safeJSON(str, fallback = {}) {
  try {
    if (!str) return fallback;
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + PASSWORD_SALT)
    .digest('hex');
}

// ---------- DATABASE INIT ----------
function initDB() {
  try {
    const Database = require('better-sqlite3');
    db = new Database(dbPath, { timeout: 10000 });
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT
      );
      CREATE TABLE IF NOT EXISTS personnel (
        id TEXT PRIMARY KEY,
        ho_ten TEXT NOT NULL,
        cccd TEXT UNIQUE,
        don_vi_id TEXT,
        cap_bac TEXT,
        chuc_vu TEXT,
        sdt_rieng TEXT,
        json_data TEXT,
        updatedAt INTEGER
      );
    `);

    console.log('SQLite initialized at:', dbPath);
  } catch (err) {
    console.error('SQLite init error:', err);
    app.whenReady().then(() => {
      dialog.showErrorBox(
        'Lỗi Cơ Sở Dữ Liệu',
        'Không thể khởi tạo dữ liệu. Kiểm tra quyền ghi thư mục.'
      );
    });
  }
}

// ---------- IPC HANDLERS ----------

// Personnel
ipcMain.handle('db-get-personnel', async (_, filters) => {
  if (!db) return [];
  try {
    let sql = 'SELECT * FROM personnel WHERE 1=1';
    const params = [];

    if (filters?.keyword) {
      const k = `%${filters.keyword}%`;
      sql += ' AND (ho_ten LIKE ? OR cccd LIKE ? OR sdt_rieng LIKE ? OR json_data LIKE ?)';
      params.push(k, k, k, k);
    }

    if (filters?.unitId && filters.unitId !== 'all') {
      sql += ' AND don_vi_id = ?';
      params.push(filters.unitId);
    }

    return db.prepare(sql).all(...params).map(r => ({
      ...safeJSON(r.json_data),
      id: r.id
    }));
  } catch (e) {
    console.error('Query personnel failed:', e);
    return [];
  }
});

ipcMain.handle('db-save-personnel', async (_, { id, data }) => {
  if (!db || !id || !data) return false;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO personnel
      (id, ho_ten, cccd, don_vi_id, cap_bac, chuc_vu, sdt_rieng, json_data, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      id,
      data.ho_ten || '',
      data.cccd || '',
      data.don_vi_id || '',
      data.cap_bac || '',
      data.chuc_vu || '',
      data.sdt_rieng || '',
      JSON.stringify(data),
      Date.now()
    );
    return true;
  } catch (e) {
    console.error('Save personnel failed:', e);
    return false;
  }
});

ipcMain.handle('db-delete-personnel', async (_, id) => {
  if (!db) return false;
  db.prepare('DELETE FROM personnel WHERE id = ?').run(id);
  return true;
});

// Units
ipcMain.handle('db-get-units', async () =>
  db ? db.prepare('SELECT * FROM units').all() : []
);

ipcMain.handle('db-save-unit', async (_, unit) => {
  if (!db || !unit) return false;
  db.prepare(
    'INSERT OR REPLACE INTO units (id, name, parentId) VALUES (?,?,?)'
  ).run(unit.id, unit.name, unit.parentId);
  return true;
});

ipcMain.handle('db-delete-unit', async (_, id) => {
  if (!db) return false;
  db.prepare('DELETE FROM units WHERE id = ? OR parentId = ?').run(id, id);
  return true;
});

// Settings & Auth
ipcMain.handle('auth-login', async (_, pass) => {
  if (!db) return pass === '123456';
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('admin_password');

  const inputHash = hashPassword(pass);
  const stored = row ? safeJSON(row.value, '123456') : '123456';

  if (stored.length === 64) {
    return inputHash === stored;
  }
  return pass === stored;
});

ipcMain.handle('auth-change-password', async (_, newPass) => {
  if (!db || !newPass) return false;
  const hashed = hashPassword(newPass);
  db.prepare(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)'
  ).run('admin_password', JSON.stringify(hashed));
  return true;
});

ipcMain.handle('db-get-setting', async (_, key) => {
  if (!db) return null;
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? safeJSON(row.value, null) : null;
});

ipcMain.handle('db-save-setting', async (_, { key, value }) => {
  if (!db) return false;
  db.prepare(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)'
  ).run(key, JSON.stringify(value));
  return true;
});

ipcMain.handle('db-get-stats', async () => {
  if (!db) return { personnelCount: 0, unitCount: 0, status: 'Disconnected' };
  const p = db.prepare('SELECT COUNT(*) AS c FROM personnel').get().c;
  const u = db.prepare('SELECT COUNT(*) AS c FROM units').get().c;
  return { personnelCount: p, unitCount: u, status: 'OK' };
});

ipcMain.handle('db-reset-all', async () => {
  if (!db) return { success: false };
  db.prepare('DELETE FROM personnel').run();
  db.prepare('DELETE FROM units').run();
  return { success: true };
});

// ---------- WINDOW ----------
function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'QN-Manager Pro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

// ---------- APP LIFECYCLE ----------
app.whenReady().then(() => {
  initDB();
  createWindow();
});

app.on('will-quit', () => {
  if (db) {
    db.close();
    console.log('SQLite closed cleanly.');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
