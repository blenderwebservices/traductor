import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const defaultTimestamp = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;
const buildTimestamp = process.env.BUILD_TIMESTAMP || defaultTimestamp;
const buildDateString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __APP_BUILD_DATE__: JSON.stringify(buildDateString),
    __APP_VERSION__: JSON.stringify(`1.0.${buildTimestamp}`),
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(import.meta.dirname, './src'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
