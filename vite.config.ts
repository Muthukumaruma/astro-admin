import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@astro/shared-types':     path.resolve(__dirname, 'src/shared/types.ts'),
      '@astro/shared-constants': path.resolve(__dirname, 'src/shared/constants.ts'),
    },
  },
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
