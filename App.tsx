import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';

// Truy cập API Electron đã được expose từ preload.js
// @ts-ignore
const electronAPI = window.electronAPI;

const App: React.FC = () => {
  // Trạng thái đăng nhập: Mặc định là false (Chưa đăng nhập)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Giả lập quá trình kiểm tra session hoặc khởi tạo ban đầu
    const initApp = async () => {
      // Có thể thêm logic kiểm tra "Ghi nhớ đăng nhập" tại đây nếu cần
      // Ví dụ: const savedToken = localStorage.getItem('token');
      // if (savedToken) setIsAuthenticated(true);
      
      setIsReady(true);
    };
    initApp();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isReady) return null; // Hoặc return <LoadingSpinner />

  // 1. Nếu chưa đăng nhập -> Hiển thị màn hình LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Nếu đã đăng nhập -> Hiển thị Dashboard (Giao diện chính)
  return (
    <HashRouter>
      <Routes>
        {/* Route chính dẫn vào Dashboard */}
        {/* Sử dụng @ts-ignore để tránh lỗi TypeScript nếu Dashboard chưa có prop onLogout */}
        <Route 
          path="/" 
          element={
            // @ts-ignore
            <Dashboard onLogout={handleLogout} />
          } 
        />
        {/* Các đường dẫn lạ sẽ tự động quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;