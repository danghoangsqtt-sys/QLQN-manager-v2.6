import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';

// --- KHAI BÁO KIỂU DỮ LIỆU (TYPE DEFINITIONS) ---
// Giúp TypeScript nhận diện API của Electron mà không báo lỗi
declare global {
  interface Window {
    electronAPI: {
      login: (password: string) => Promise<boolean>;
      changePassword: (password: string) => Promise<boolean>;
      updateFromFile: () => Promise<{ success: boolean; message: string }>;
    };
  }
}

const App: React.FC = () => {
  // Trạng thái đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Trạng thái khởi tạo ứng dụng
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Tại đây có thể thêm logic kiểm tra token lưu trong localStorage nếu muốn tính năng "Ghi nhớ đăng nhập"
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

  // Màn hình chờ khi ứng dụng đang khởi tạo
  if (!isReady) return null;

  // 1. Nếu chưa đăng nhập -> Hiển thị màn hình LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  // 2. Nếu đã đăng nhập -> Hiển thị Dashboard
  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            // Sử dụng {...({} as any)} để truyền props mà không bị TypeScript báo lỗi 
            // nếu Dashboard chưa định nghĩa interface cho onLogout.
            <Dashboard {...({ onLogout: handleLogout } as any)} />
          } 
        />
        {/* Các đường dẫn không tồn tại sẽ tự động quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;