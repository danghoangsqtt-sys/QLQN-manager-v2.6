import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// [QUAN TRỌNG] Import CSS để Tailwind hoạt động offline
import './index.css';

const RootComponent = () => {
  useEffect(() => {
    // Ẩn màn hình loading khi React đã mount xong
    const loader = document.getElementById('loading-screen');
    if (loader) {
      // Hiệu ứng mờ dần
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.remove();
      }, 500);
    }
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Khởi tạo React App
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <RootComponent />
);