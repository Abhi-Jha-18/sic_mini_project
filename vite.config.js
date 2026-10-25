import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// PhoneFit — Vite build + Vitest test configuration.
// The dev server binds 0.0.0.0 and allows any Host header so it works behind
// the Arena live-preview proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
