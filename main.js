
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'du_lieu_quan_nhan_v4.db');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.error("Lỗi khởi tạo DB:", err);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL, parentId TEXT);
  CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    cccd TEXT UNIQUE,
    don_vi_id TEXT,
    cap_bac TEXT,
    chuc_vu TEXT,
    sdt_rieng TEXT,
    que_quan TEXT,
    json_data TEXT,
    updatedAt INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_p_search ON personnel(ho_ten, cccd, sdt_rieng);
  CREATE INDEX IF NOT EXISTS idx_p_unit ON personnel(don_vi_id);
`);

ipcMain.handle('db-get-personnel', async (event, filters = {}) => {
  let query = 'SELECT * FROM personnel WHERE 1=1';
  const params = [];

  // 1. TỪ KHÓA TÌM KIẾM
  if (filters.keyword) {
    query += ' AND (ho_ten LIKE ? OR cccd LIKE ? OR sdt_rieng LIKE ? OR que_quan LIKE ?)';
    const k = `%${filters.keyword}%`;
    params.push(k, k, k, k);
  }

  // 2. ĐƠN VỊ
  if (filters.unitId && filters.unitId !== 'all') {
    query += ' AND don_vi_id = ?';
    params.push(filters.unitId);
  }

  // 3. QUÂN HÀM
  if (filters.rank && filters.rank !== 'all') {
    query += ' AND cap_bac = ?';
    params.push(filters.rank);
  }

  // 4. CHỨC VỤ
  if (filters.position && filters.position !== 'all') {
    query += ' AND chuc_vu LIKE ?';
    params.push(`%${filters.position}%`);
  }

  // 5. TRÌNH ĐỘ HỌC VẤN (Sâu trong JSON)
  if (filters.education && filters.education !== 'all') {
    query += " AND json_extract(json_data, '$.trinh_do_van_hoa') LIKE ?";
    params.push(`%${filters.education}%`);
  }

  // 6. DIỆN CHÍNH TRỊ (Dựa vào ngày vào Đảng)
  if (filters.political === 'dang_vien') {
    query += " AND (json_extract(json_data, '$.vao_dang_ngay') IS NOT NULL AND json_extract(json_data, '$.vao_dang_ngay') != '')";
  } else if (filters.political === 'quan_chung') {
    query += " AND (json_extract(json_data, '$.vao_dang_ngay') IS NULL OR json_extract(json_data, '$.vao_dang_ngay') = '')";
  }

  // 7. YẾU TỐ NƯỚC NGOÀI
  if (filters.foreignElement === 'has_relatives') {
    query += " AND json_extract(json_data, '$.yeu_to_nuoc_ngoai.than_nhan[0]') IS NOT NULL";
  } else if (filters.foreignElement === 'has_passport') {
    query += " AND json_extract(json_data, '$.yeu_to_nuoc_ngoai.ho_chieu.da_co') = 1";
  }

  // 8. HOÀN CẢNH GIA ĐÌNH
  if (filters.familyStatus === 'poor') {
    query += " AND json_extract(json_data, '$.thong_tin_gia_dinh_chung.muc_song') = 'Khó khăn'";
  } else if (filters.familyStatus === 'violation') {
    query += " AND json_extract(json_data, '$.thong_tin_gia_dinh_chung.lich_su_vi_pham_nguoi_than.co_khong') = 1";
  } else if (filters.familyStatus === 'special_circumstances') {
    query += " AND (json_extract(json_data, '$.y_kien_nguyen_vong') IS NOT NULL AND json_extract(json_data, '$.y_kien_nguyen_vong') != '')";
  }

  // 9. TÌNH TRẠNG HÔN NHÂN
  if (filters.marital === 'da_ket_hon') {
    query += " AND json_extract(json_data, '$.quan_he_gia_dinh.vo') IS NOT NULL";
  } else if (filters.marital === 'doc_than') {
    query += " AND json_extract(json_data, '$.quan_he_gia_dinh.vo') IS NULL";
  }

  // 10. AN NINH - KỶ LUẬT - VAY NỢ
  if (filters.security === 'vay_no') {
    query += " AND json_extract(json_data, '$.tai_chinh_suc_khoe.vay_no.co_khong') = 1";
  } else if (filters.security === 'vi_pham') {
    query += " AND json_extract(json_data, '$.lich_su_vi_pham.vi_pham_dia_phuong.co_khong') = 1";
  } else if (filters.security === 'ma_tuy') {
    query += " AND json_extract(json_data, '$.lich_su_vi_pham.ma_tuy.co_khong') = 1";
  }

  query += ' ORDER BY updatedAt DESC';

  try {
    const rows = db.prepare(query).all(...params);
    return rows.map(row => ({
      ...JSON.parse(row.json_data || '{}'),
      id: row.id,
      ho_ten: row.ho_ten,
      cccd: row.cccd,
      don_vi_id: row.don_vi_id,
      cap_bac: row.cap_bac,
      chuc_vu: row.chuc_vu,
      sdt_rieng: row.sdt_rieng
    }));
  } catch (e) {
    console.error("Query error:", e);
    return [];
  }
});

ipcMain.handle('db-save-setting', async (e, { key, value }) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  return true;
});

ipcMain.handle('db-get-setting', async (e, key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
});

ipcMain.handle('db-save-personnel', async (event, { id, data }) => {
  const now = Date.now();
  const jsonStr = JSON.stringify(data);
  db.prepare(`INSERT OR REPLACE INTO personnel (id, ho_ten, cccd, don_vi_id, cap_bac, chuc_vu, sdt_rieng, que_quan, json_data, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, data.ho_ten, data.cccd, data.don_vi_id, data.cap_bac, data.chuc_vu, data.sdt_rieng, data.noi_sinh, jsonStr, now);
  return true;
});

ipcMain.handle('db-get-units', async () => db.prepare('SELECT * FROM units').all());
ipcMain.handle('db-save-unit', async (event, unit) => {
  db.prepare('INSERT OR REPLACE INTO units (id, name, parentId) VALUES (?,?,?)').run(unit.id, unit.name, unit.parentId);
  return true;
});
ipcMain.handle('db-delete-unit', async (e, id) => db.prepare('DELETE FROM units WHERE id=?').run(id));

ipcMain.handle('db-delete-personnel', async (e, id) => db.prepare('DELETE FROM personnel WHERE id=?').run(id));

ipcMain.handle('db-get-stats', async () => {
  const pCount = db.prepare('SELECT COUNT(*) as count FROM personnel').get().count;
  const uCount = db.prepare('SELECT COUNT(*) as count FROM units').get().count;
  return { personnelCount: pCount, unitCount: uCount, dbSize: 'N/A', status: 'SQLite Connected' };
});

ipcMain.handle('db-reset-all', async () => {
  db.prepare('DELETE FROM personnel').run();
  db.prepare('DELETE FROM units').run();
  return { success: true };
});

ipcMain.handle('auth-login', async (event, password) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password');
  if (!row) return password === '123456';
  return JSON.parse(row.value) === password;
});

ipcMain.handle('auth-change-password', async (e, newPass) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_password', JSON.stringify(newPass));
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 950,
    title: "QN-Manager Pro V5.0",
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile(path.join(__dirname, 'dist/index.html'));
  win.setMenuBarVisibility(false);
}
app.whenReady().then(createWindow);
