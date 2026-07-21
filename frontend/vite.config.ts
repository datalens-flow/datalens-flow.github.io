import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'flow-vendor': ['@xyflow/react', '@dagrejs/dagre'],
          'codemirror-vendor': [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/lang-sql',
            '@codemirror/language',
            '@codemirror/commands'
          ],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'xlsx-vendor': ['xlsx'],
          'canvas-vendor': ['html-to-image', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
  },
});
