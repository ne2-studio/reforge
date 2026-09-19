import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// Split out as a factory (rather than a single `export default defineConfig({...})`) so
// vitest.config.ts and .storybook/main.ts can both reuse the exact same base config via
// mergeConfig, instead of hand-duplicating plugins/aliases in three places.
export function createViteConfig() {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
    },

    preview: {
      port: 4173,
      strictPort: true,
    },

    build: {
      target: 'esnext',
      sourcemap: true,
    },
  };
}

export default defineConfig(createViteConfig());
