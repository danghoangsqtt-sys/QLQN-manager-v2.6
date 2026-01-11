import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load biến môi trường từ file .env (nếu có)
    const env = loadEnv(mode, '.', '');
    
    return {
      // QUAN TRỌNG: Đường dẫn tương đối để chạy được trên giao thức file:// của Electron
      base: './', 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [
        react()
        // Lưu ý: Đã xóa plugin 'legacy()' gây lỗi tại đây
      ],
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      build: {
        // Tăng giới hạn cảnh báo size chunk nếu cần
        chunkSizeWarningLimit: 1000,
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
      }
    };
});