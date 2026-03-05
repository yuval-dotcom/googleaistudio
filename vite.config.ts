import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiApiPlugin } from './vite-plugin-ai-api';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), aiApiPlugin()],
  // No API keys in client – Gemini is called only from /api/ai on the server
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'vitest.setup.ts', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'server/**'],
    },
    projects: [
      {
        name: 'frontend',
        test: {
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['**/*.{test,spec}.{ts,tsx}'],
          exclude: ['server/**', 'node_modules/**'],
        },
      },
      {
        name: 'server',
        test: {
          environment: 'node',
          include: ['server/**/*.{test,spec}.js'],
          exclude: ['node_modules/**'],
        },
      },
    ],
  },
});
