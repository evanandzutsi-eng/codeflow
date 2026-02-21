import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to the backend in development
    // This avoids CORS issues and keeps API keys server-side
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // SECURITY: Only VITE_* env vars are exposed to the client
  // This prevents accidental leaking of server-side secrets
  envPrefix: 'VITE_',
});
