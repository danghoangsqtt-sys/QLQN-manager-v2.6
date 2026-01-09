
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
const RootComponent = () => {
  useEffect(() => {
    // Ẩn màn hình loading khi component mount
    const loader = document.getElementById('loading-screen');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 300);
    }
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    setTimeout(init, 50);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<RootComponent />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
