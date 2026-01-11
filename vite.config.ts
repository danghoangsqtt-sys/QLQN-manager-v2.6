import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load các biến môi trường từ file .env (nếu có)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // [QUAN TRỌNG] Đường dẫn cơ sở là './' để ứng dụng tìm thấy file
    // asset (css, js, ảnh) khi chạy trực tiếp từ file system (file://) trong Electron.
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0', // Cho phép truy cập từ mạng LAN nếu cần
    },

    plugins: [
      react(),
      // Plugin Legacy: Giúp ứng dụng chạy được trên các môi trường WebView cũ
      // và hỗ trợ nạp script tốt hơn trên giao thức file://
      legacy({
        targets: ['defaults'],
        renderLegacyChunks: true,
        polyfills: true,
      })
    ],

    resolve: {
      alias: {
        // Giữ nguyên cấu hình alias cũ của bạn để tránh lỗi import trong các file khác
        '@': path.resolve(__dirname, '.'),
      }
    },

    define: {
      // Định nghĩa các biến toàn cục để code có thể sử dụng (ví dụ API Key)
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    build: {
      // Thư mục đầu ra khi build
      outDir: 'dist',
      // Xóa thư mục dist cũ trước khi build mới để tránh file rác
      emptyOutDir: true,
      // Tối ưu hóa việc chia nhỏ file (Chunking) giúp load nhanh hơn
      rollupOptions: {
        output: {
          manualChunks: {
            // Gom các thư viện lớn vào file vendor riêng
            vendor: ['react', 'react-dom', 'react-router-dom', 'dexie', 'lucide-react'],
          },
        },
      },
    }
  };
});