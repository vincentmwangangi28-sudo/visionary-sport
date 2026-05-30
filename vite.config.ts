import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
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
            if (["react", "react-dom", "react-router-dom"].some(p => id.includes(`/${p}/`))) return "vendor-react";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("@radix-ui") || id.includes("lucide-react")) return "vendor-ui";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@supabase/supabase-js", "@tanstack/react-query"],
  },
}));
