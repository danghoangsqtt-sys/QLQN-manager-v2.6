const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const isDev = require('electron-is-dev');

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
  const stored = settings['admin_password'] || '123456';
  return stored.length === 64 ? hashPassword(p) === stored : p === stored;
});

ipcMain.handle('auth:changePassword', (_, p) => {
  const settings = readSecureSettings();
  settings['admin_password'] = hashPassword(p);
  writeSecureSettings(settings);
  return true;
});

// Thêm handler giả lập để tránh lỗi nếu preload gọi (dù store dùng dexie)
ipcMain.handle('db:getStats', async () => ({ status: 'OK' }));
ipcMain.handle('db:saveSetting', async () => true);
ipcMain.handle('db:getSetting', async () => null);

// --- WINDOW MANAGEMENT ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#14452F',
    show: false,
    icon: path.join(__dirname, 'public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    }
  });

  // Cấu hình CSP (Đã sửa để chạy được Dev mode)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const devCSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: http: https:;";
    const prodCSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://esm.sh;";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [ isDev ? devCSP : prodCSP ]
      }
    });
  });

  if (isDev) {
    console.log('Running in Development Mode');
    win.loadURL('http://localhost:3000'); 
    // Đã tắt tự động bật console. Nếu cần debug, nhấn Ctrl+Shift+I
    // win.webContents.openDevTools(); 
  } else {
    console.log('Running in Production Mode');
    // Sửa đường dẫn để trỏ đúng vào thư mục dist khi build
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => {
    win.show();
  });
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  createWindow();
  session.defaultSession.setUserAgent(session.defaultSession.getUserAgent() + ' QNManager/7.0');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});