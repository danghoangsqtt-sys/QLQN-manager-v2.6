import React from 'react';
import ReactDOM from 'react-dom/client';
// Sửa đường dẫn import App từ './App' thành './components/App'
import App from './components/App';

// Kiểm tra xem phần tử root có tồn tại không để tránh lỗi runtime
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử có id "root" trong index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);