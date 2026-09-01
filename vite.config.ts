import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: { host: "0.0.0.0", port: 3000 },
  plugins: [react()],
  resolve: { 
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Flat asset paths - avoids Vercel rewrite conflicts
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (["react", "react-dom", "react-router-dom"].some(p => id.includes(`/${p}/`))) {
              return "vendor-framework";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) {
              return "vendor-charts";
            }
            if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("motion") || id.includes("framer-motion")) {
              return "vendor-ui";
            }
            if (id.includes("@tanstack") || id.includes("sonner") || id.includes("date-fns") || id.includes("clsx") || id.includes("tailwind-merge")) {
              return "vendor-utils";
            }
            return "vendor-libs";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@supabase/supabase-js", "@tanstack/react-query"],
  },
}));
