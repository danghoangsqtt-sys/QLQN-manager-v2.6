const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const isDev = require('electron-is-dev'); // Thư viện này đã có trong package.json

// CẤU HÌNH BẢO MẬT & DỮ LIỆU
const PASSWORD_SALT = 'DHsystem_Salt_2026_Dexie';
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'app_secure_settings.json');

// Khởi tạo thư mục và tệp bảo mật nếu chưa có
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, '{}', 'utf8');

const readSecureSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    return {};
  }
};

const writeSecureSettings = (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

// --- IPC HANDLERS ---
ipcMain.handle('auth:login', (_, p) => {
  const settings = readSecureSettings();
  const stored = settings['admin_password'] || '123456'; // Mặc định 123456 nếu chưa đổi
  // Nếu mật khẩu lưu là hash (64 ký tự) thì so sánh hash, ngược lại so sánh plain text (lần đầu)
  return stored.length === 64 ? hashPassword(p) === stored : p === stored;
});

ipcMain.handle('auth:changePassword', (_, p) => {
  const settings = readSecureSettings();
  settings['admin_password'] = hashPassword(p);
  writeSecureSettings(settings);
  return true;
});

// --- WINDOW MANAGEMENT ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#14452F', // Màu nền khớp với theme ứng dụng để tránh nháy trắng
    show: false, // Chỉ show khi đã ready
    icon: path.join(__dirname, 'public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Cần thiết cho một số API file hệ thống nếu mở rộng sau này
      webSecurity: true, // BẬT LẠI BẢO MẬT (Quan trọng)
    }
  });

  // Cấu hình CSP (Content Security Policy) để cho phép load tài nguyên từ CDN an toàn
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://esm.sh;"
        ]
      }
    });
  });

  // LOGIC TẢI TRANG THÔNG MINH (Sửa lỗi quan trọng)
  if (isDev) {
    // Trong môi trường Dev: Load từ Vite Server (để hỗ trợ HMR và file .tsx)
    console.log('Running in Development Mode');
    win.loadURL('http://localhost:3000'); 
    win.webContents.openDevTools(); // Mở DevTools để debug
  } else {
    // Trong môi trường Prod: Load file đã build
    console.log('Running in Production Mode');
    // Kiểm tra xem file index.html nằm ở đâu (thường là cùng cấp hoặc trong dist)
    // Với cấu trúc hiện tại, giả định build xong nằm cùng thư mục
    win.loadFile(path.join(__dirname, 'index.html'));
  }

  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => {
    win.show();
  });
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  createWindow();
  
  // Sửa lỗi UserAgent để tránh bị chặn bởi một số dịch vụ (nếu có dùng request ngoài)
  session.defaultSession.setUserAgent(session.defaultSession.getUserAgent() + ' QNManager/7.0');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});