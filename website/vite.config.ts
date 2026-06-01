import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

type LocalProductionConfig = {
  allowedHosts?: string[];
};

let localProductionConfig: LocalProductionConfig = {};
try {
  const mod = await import('./production');
  localProductionConfig = mod.localProductionConfig ?? {};
} catch {
  localProductionConfig = {};
}

const allowedHosts = localProductionConfig.allowedHosts ?? [];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts,
  },
  preview: {
    port: 3000,
    strictPort: true,
    allowedHosts,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            return 'vendor';
          }
        },
      },
    },
  },
});
