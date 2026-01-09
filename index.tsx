
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App.tsx';

const RootComponent = () => {
  useEffect(() => {
    // Hàm ẩn màn hình loading
    const hideLoader = () => {
      const loader = document.getElementById('loading-screen');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    };

    // Gọi ẩn sau khi component đã mount
    hideLoader();
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const init = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error("Không tìm thấy phần tử #root");

    const root = ReactDOM.createRoot(rootElement);
    root.render(<RootComponent />);
  } catch (error) {
    console.error("Lỗi khởi tạo React:", error);
    const text = document.getElementById('loading-text');
    if (text) text.innerHTML = `<span style="color: #ff8a8a">LỖI RENDER: ${error.message}</span>`;
  }
};

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
