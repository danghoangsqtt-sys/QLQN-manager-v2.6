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
// Cập nhật logic Login để tự động lưu hash mật khẩu mặc định nếu chưa có
ipcMain.handle('auth:login', (_, p) => {
  const settings = readSecureSettings();
  let stored = settings['admin_password'];
  
  // Nếu chưa có mật khẩu trong file setting (lần đầu chạy)
  if (!stored) {
      if (p === '123456') {
          // Lưu ngay mật khẩu mặc định dưới dạng hash để bảo mật cho lần sau
          settings['admin_password'] = hashPassword('123456');
          writeSecureSettings(settings);
          return true;
      }
      return false;
  }
  
  return hashPassword(p) === stored;
});

ipcMain.handle('auth:changePassword', (_, p) => {
  const settings = readSecureSettings();
  settings['admin_password'] = hashPassword(p);
  writeSecureSettings(settings);
  return true;
});

// Thêm handler giả lập để tránh lỗi nếu preload gọi (dù store dùng dexie)
ipcMain.handle('db:getStats', async () => ({ status: 'OK' }));
// Thêm Handler lưu setting thực sự
ipcMain.handle('db:saveSetting', (_, {key, value}) => {
    try {
        const settings = readSecureSettings();
        settings[key] = value;
        writeSecureSettings(settings);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
});
ipcMain.handle('db:getSetting', (_, key) => {
    const settings = readSecureSettings();
    return settings[key];
});

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
    const prodCSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: https://fonts.googleapis.com https://fonts.gstatic.com;";

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