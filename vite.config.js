import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      '/pocket': {
        target: 'https://getpocket.com/v3/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pocket/, ''),
      },
    },
  },
});
