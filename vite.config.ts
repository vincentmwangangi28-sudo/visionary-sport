import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    // Target modern browsers — smaller output
    target: "es2020",
    // Warn at 600KB (we've already split routes)
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for production debugging
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (["react", "react-dom", "react-router-dom"].some(p => id.includes(`/${p}/`)))
              return "vendor-react";
            if (id.includes("@supabase"))
              return "vendor-supabase";
            if (id.includes("recharts") || id.includes("d3-"))
              return "vendor-charts";
            if (id.includes("@tanstack"))
              return "vendor-query";
            if (id.includes("@radix-ui") || id.includes("lucide-react"))
              return "vendor-ui";
          }
        },
        // Predictable file names for CDN caching
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (info) => {
          const ext = info.name?.split(".").pop() ?? "";
          if (["png", "jpg", "jpeg", "webp", "svg", "gif", "ico"].includes(ext))
            return "assets/img/[name]-[hash][extname]";
          if (["woff", "woff2", "ttf", "eot"].includes(ext))
            return "assets/fonts/[name]-[hash][extname]";
          if (ext === "css")
            return "assets/css/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  // Optimise dev server pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],
  },
}));
