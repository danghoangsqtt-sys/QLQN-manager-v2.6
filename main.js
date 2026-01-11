const { app, BrowserWindow, ipcMain, session, dialog, shell } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const isDev = require('electron-is-dev');

// --- CẤU HÌNH BẢO MẬT & DỮ LIỆU ---
// Chỉ dùng file JSON này để lưu Mật khẩu Admin (tránh reset khi xóa cache trình duyệt)
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

// 1. Auth Handlers (GIỮ NGUYÊN: Để bảo mật mật khẩu)
ipcMain.handle('auth:login', (_, p) => {
  const settings = readSecureSettings();
  let stored = settings['admin_password'];
  
  // Nếu chưa có mật khẩu (lần đầu chạy)
  if (!stored) {
      if (p === '123456') {
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

// [ĐÃ XÓA] db:getStats, db:saveSetting, db:getSetting 
// Lý do: Đã chuyển sang dùng Dexie ở Renderer để tránh xung đột dữ liệu.

// 2. System Handlers (Update Logic)
ipcMain.handle('system:updateFromFile', async () => {
  const win = BrowserWindow.getFocusedWindow();
  
  const result = await dialog.showOpenDialog(win, {
    title: 'Chọn file cài đặt phiên bản mới',
    properties: ['openFile'],
    filters: [
      { name: 'File cài đặt', extensions: ['exe'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Đã hủy chọn file.' };
  }

  const installerPath = result.filePaths[0];

  try {
    // Mở file cài đặt và đợi lệnh được gửi đi thành công
    await shell.openPath(installerPath);
    
    // Đợi 3 giây để đảm bảo tiến trình cài đặt được kích hoạt trước khi đóng app
    setTimeout(() => {
      app.quit();
    }, 3000);

    return { success: true, message: 'Đang khởi chạy bộ cài đặt, ứng dụng sẽ tự tắt sau 3 giây...' };
  } catch (error) {
    return { success: false, message: 'Lỗi khi mở file: ' + error.message };
  }
});

// --- WINDOW MANAGEMENT ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#14452F', // Màu nền mặc định khi load
    show: false,
    icon: path.join(__dirname, 'public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true, // Luôn bật webSecurity
    }
  });

  // FIX: Cấu hình CSP chặt chẽ hơn cho Production nhưng phải hỗ trợ file://
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Dev: Cho phép lỏng lẻo để hot-reload hoạt động
    const devCSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: http: https:;";
    
    // Prod: Cho phép file: và unsafe-eval (để đảm bảo tương thích với một số thư viện React build cũ)
    const prodCSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: https:;"; 

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
  // Giữ UserAgent custom để định danh
  session.defaultSession.setUserAgent(session.defaultSession.getUserAgent() + ' QNManager/7.0');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});