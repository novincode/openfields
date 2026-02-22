import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const sourceBanner = '/*! Codeideal Open Fields - Source: https://github.com/novincode/openfields/tree/main/admin/src - Build: pnpm run build */\n';

function bannerPlugin() {
  return {
    name: 'banner',
    writeBundle(_options: any, bundle: Record<string, any>) {
      for (const [fileName] of Object.entries(bundle)) {
        if (fileName.endsWith('.js')) {
          const filePath = path.resolve(__dirname, 'plugin/assets/admin', fileName);
          const content = fs.readFileSync(filePath, 'utf-8');
          fs.writeFileSync(filePath, sourceBanner + content);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), bannerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './admin/src'),
    },
  },
  build: {
    outDir: 'plugin/assets/admin',
    emptyOutDir: false, // Don't delete fields.js and fields.css
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
