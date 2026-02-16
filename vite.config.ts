import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createClaudePlugin } from './server/claudePlugin';
import { createReportPlugin } from './server/reportPlugin';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), createReportPlugin({ rootDir: __dirname }), createClaudePlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/scheduler/')
              ) {
                return 'react-vendor';
              }
              if (id.includes('framer-motion')) {
                return 'motion-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('@google/genai')) {
                return 'ai-vendor';
              }
            },
          },
        },
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts'
      }
    };
});
