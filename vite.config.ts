import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Reduce main-thread parse/compile by isolating heavy deps into async chunks
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split vendor libs so heavy/non-critical code is parsed only when needed
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Critical path
          if (id.includes('react-dom') || id.match(/[\\/]react[\\/]/) || id.includes('react-router-dom') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('react-helmet-async')) return 'vendor-helmet';
          // Heavy / below-the-fold libs — kept out of the initial bundle
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('date-fns') || id.includes('dayjs')) return 'vendor-date';
          if (id.includes('embla-carousel')) return 'vendor-carousel';
          if (id.includes('cmdk') || id.includes('vaul') || id.includes('sonner')) return 'vendor-ui';
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          return 'vendor';
        },
      },
    },
  },
}));
