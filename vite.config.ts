import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    open: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react') && id.includes('react-dom')) {
            return 'vendor';
          }
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide-react')) {
            return 'ui';
          }
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  }
});