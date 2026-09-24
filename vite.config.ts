import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Reduce main-thread parse/compile by isolating heavy deps into async chunks
    target: 'es2020',
    cssCodeSplit: true,
    // Custom manualChunks removed: splitting React-dependent libs into a
    // separate "vendor" chunk caused "Cannot read properties of undefined
    // (reading 'createContext')" in production. Vite's default split is safe.
  },
}));
