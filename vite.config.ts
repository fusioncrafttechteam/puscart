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
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) {
            return
          }
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('lucide-react') || id.includes('@heroicons')) return 'ui'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/scheduler')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  }
});
