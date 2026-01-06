const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const fs = require('fs');
const crypto = require('crypto'); // Thêm module crypto để bảo mật mật khẩu

// --- CẤU HÌNH ĐƯỜNG DẪN DỮ LIỆU ---
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

const dbPath = path.join(userDataPath, 'military_records_v2.db'); // Đổi tên DB để tránh xung đột cấu trúc cũ
let db;

// --- HÀM BĂM MẬT KHẨU (PBKDF2) ---
function hashPassword(password, salt = null) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(inputPassword, storedHash, storedSalt) {
  const hash = crypto.pbkdf2Sync(inputPassword, storedSalt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// --- KHỞI TẠO DATABASE ---
try {
  db = new Database(dbPath, { verbose: isDev ? console.log : null });
  
  // Tối ưu hiệu năng SQLite
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // 1. Bảng Settings (Lưu mật khẩu admin đã mã hóa)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      salt TEXT
    );
  `);

  // Khởi tạo mật khẩu mặc định '123456' nếu chưa có
  const checkPass = db.prepare("SELECT key FROM settings WHERE key = 'admin_password'").get();
  if (!checkPass) {
    const { hash, salt } = hashPassword('123456');
    db.prepare("INSERT INTO settings (key, value, salt) VALUES (?, ?, ?)").run('admin_password', hash, salt);
    console.log('Đã khởi tạo mật khẩu mặc định: 123456');
  }

  // 2. Bảng Quân nhân (Personnel) - Tách cột để tối ưu query
  db.exec(`
    CREATE TABLE IF NOT EXISTS personnel (
      id TEXT PRIMARY KEY,
      ho_ten TEXT,
      don_vi_id TEXT,
      cap_bac TEXT,
      chuc_vu TEXT,
      trinh_do_van_hoa TEXT,
      is_dang_vien INTEGER, -- 0: Chưa, 1: Đảng viên
      has_vi_pham INTEGER,  -- 0: Không, 1: Có
      search_text TEXT,     -- Gộp tên, cccd, sdt để tìm kiếm nhanh
      full_data TEXT,       -- JSON gốc chứa toàn bộ thông tin chi tiết
      createdAt INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_don_vi ON personnel(don_vi_id);
    CREATE INDEX IF NOT EXISTS idx_ho_ten ON personnel(ho_ten);
    CREATE INDEX IF NOT EXISTS idx_search ON personnel(search_text);
  `);

  // 3. Bảng Đơn vị (Units)
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT,
      parentId TEXT
    );
  `);

} catch (err) {
  console.error('CRITICAL ERROR: Không thể khởi tạo cơ sở dữ liệu:', err);
}

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
    icon: path.join(__dirname, 'public/icon.png') // Đảm bảo bạn có file icon
  });

  win.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, 'index.html')}`
  );

  // Ẩn menu mặc định để ứng dụng giống App hơn
  win.setMenuBarVisibility(false); 

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// --- IPC HANDLERS: XỬ LÝ LOGIC NGHIỆP VỤ ---

// 1. Xác thực mật khẩu an toàn
ipcMain.handle('auth-login', async (event, inputPassword) => {
  try {
    const record = db.prepare("SELECT value, salt FROM settings WHERE key = 'admin_password'").get();
    if (!record) return false;
    return verifyPassword(inputPassword, record.value, record.salt);
  } catch (err) {
    console.error('Auth error:', err);
    return false;
  }
});

ipcMain.handle('auth-change-password', async (event, newPassword) => {
  try {
    const { hash, salt } = hashPassword(newPassword);
    db.prepare("UPDATE settings SET value = ?, salt = ? WHERE key = 'admin_password'").run(hash, salt);
    return true;
  } catch (err) {
    console.error('Change pass error:', err);
    return false;
  }
});

// 2. Lấy danh sách quân nhân (Có lọc tại SQL)
ipcMain.handle('db-get-personnel', async (event, filters = {}) => {
  try {
    let query = "SELECT full_data FROM personnel WHERE 1=1";
    const params = [];

    // Lọc theo Đơn vị
    if (filters.unitId && filters.unitId !== 'all') {
      query += " AND don_vi_id = ?";
      params.push(filters.unitId);
    }

    // Lọc theo Từ khóa (Full text search trên cột search_text)
    if (filters.keyword) {
      query += " AND search_text LIKE ?";
      params.push(`%${filters.keyword}%`);
    }

    // Lọc theo Cấp bậc
    if (filters.rank && filters.rank !== 'all') {
      query += " AND cap_bac = ?";
      params.push(filters.rank);
    }

    // Lọc theo Học vấn
    if (filters.education && filters.education !== 'all') {
      query += " AND trinh_do_van_hoa = ?";
      params.push(filters.education);
    }

    // Lọc theo Đảng viên
    if (filters.political && filters.political !== 'all') {
      if (filters.political === 'dang_vien') query += " AND is_dang_vien = 1";
      if (filters.political === 'quan_chung') query += " AND is_dang_vien = 0";
    }

    // Lọc theo An ninh (Vi phạm)
    if (filters.security === 'vi_pham') {
      query += " AND has_vi_pham = 1";
    }
    // Lưu ý: Các lọc phức tạp hơn (vay nợ, nước ngoài) vẫn cần xử lý thêm hoặc tách cột nếu cần.
    // Hiện tại ta ưu tiên hiệu năng các lọc chính.

    query += " ORDER BY createdAt DESC";

    const rows = db.prepare(query).all(...params);
    
    // Parse lại JSON để trả về cho Frontend
    return rows.map(row => JSON.parse(row.full_data));

  } catch (err) {
    console.error('Lỗi truy vấn personnel:', err);
    return [];
  }
});

// 3. Lưu hồ sơ (Tự động tách dữ liệu vào các cột)
ipcMain.handle('db-save-personnel', async (event, { id, data }) => {
  try {
    const fullDataStr = JSON.stringify(data);
    
    // Chuẩn bị dữ liệu cho các cột tìm kiếm
    const searchText = `${data.ho_ten || ''} ${data.cccd || ''} ${data.sdt_rieng || ''} ${data.nang_khieu_so_truong || ''}`.toLowerCase();
    const isDangVien = (data.vao_dang_ngay && data.vao_dang_ngay.trim() !== '') ? 1 : 0;
    
    // Kiểm tra cờ vi phạm (Logic đơn giản)
    const hasViPham = (
      data.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong || 
      data.lich_su_vi_pham?.danh_bac?.co_khong || 
      data.lich_su_vi_pham?.ma_tuy?.co_khong
    ) ? 1 : 0;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO personnel (
        id, ho_ten, don_vi_id, cap_bac, chuc_vu, trinh_do_van_hoa, 
        is_dang_vien, has_vi_pham, search_text, full_data, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      id, 
      data.ho_ten, 
      data.don_vi_id, 
      data.cap_bac, 
      data.chuc_vu, 
      data.trinh_do_van_hoa, 
      isDangVien,
      hasViPham,
      searchText,
      fullDataStr,
      data.createdAt || Date.now()
    );
  } catch (err) {
    console.error('Lỗi lưu personnel:', err);
    throw err;
  }
});

// 4. Xóa hồ sơ
ipcMain.handle('db-delete-personnel', async (event, id) => {
  try {
    return db.prepare('DELETE FROM personnel WHERE id = ?').run(id);
  } catch (err) {
    console.error('Lỗi xóa personnel:', err);
    throw err;
  }
});

// --- UNIT HANDLERS ---
ipcMain.handle('db-get-units', async () => {
  return db.prepare('SELECT * FROM units').all();
});

ipcMain.handle('db-save-unit', async (event, unit) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO units (id, name, parentId) VALUES (?, ?, ?)');
  return stmt.run(unit.id, unit.name, unit.parentId);
});

ipcMain.handle('db-delete-unit', async (event, id) => {
  return db.prepare('DELETE FROM units WHERE id = ?').run(id);
});

// --- SYSTEM HANDLERS ---
ipcMain.handle('db-reset-all', async () => {
  try {
    const transaction = db.transaction(() => {
        db.prepare('DELETE FROM personnel').run();
        db.prepare('DELETE FROM units').run();
        // Không xóa bảng settings để giữ mật khẩu
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