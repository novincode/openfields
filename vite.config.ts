import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './admin/src'),
    },
  },
  build: {
    outDir: 'plugin/assets/admin',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin/src/main.tsx'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/wp-json': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/wp-admin': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/wp-content': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
