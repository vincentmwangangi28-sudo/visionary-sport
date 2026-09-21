import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function geminiTasksPlugin(): Plugin {
  return {
    name: "gemini-tasks-api",
    configureServer(server) {
      server.middlewares.use("/api/gemini-tasks", async (req, res) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk: any) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const { handleGeminiTask } = await import("./src/server/geminiHandler");
              const parsed = JSON.parse(body || "{}");
              const result = await handleGeminiTask(parsed.task || "match_analysis", parsed.payload || {});
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
            }
          });
        } else {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ status: "ok" }));
        }
      });
    },
  };
}

function cronTasksPlugin(): Plugin {
  return {
    name: "cron-tasks-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (url.startsWith("/api/") && (url.endsWith("-cron") || url.includes("/cron") || url === "/api/indexing-cron")) {
          try {
            const { handleCronTask } = await import("./src/server/cronApiHandler");
            const result = await handleCronTask(url);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || "Cron execution failed" }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      clientPort: 3000,
      protocol: "ws",
    },
  },
  plugins: [react(), geminiTasksPlugin(), cronTasksPlugin()],
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
