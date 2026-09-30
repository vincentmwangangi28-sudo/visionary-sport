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
              const { handleGeminiTask } = await import("./src/server/geminiHandler.ts");
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
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; upgrade-insecure-requests;"
        );
        const url = req.url?.split("?")[0] || "";
        const { buildLinkHeader, buildMarkdownForRoute, handleMcpJsonRpc } = await import("./src/server/agentDiscovery.ts");

        if (url === "/api/health" || url === "/api/status") {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.statusCode = 200;
          res.end(JSON.stringify({ status: "ok", service: "PredictPro.guru Quantitative Football Analytics", version: "2.4.0" }));
          return;
        }

        if (url === "/api/jackpots") {
          try {
            const force = Boolean(req.url?.includes("force=true") || req.url?.includes("force=1"));
            const { handleDirectJackpotFetch } = await import("./src/server/jackpotDirectHandler.ts");
            const data = await handleDirectJackpotFetch(force);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || "Failed to fetch direct jackpots" }));
          }
          return;
        }

        if (url === "/api/telegram-broadcast") {
          let body = "";
          req.on("data", (c: any) => { body += c; });
          req.on("end", async () => {
            try {
              const { handleTelegramRequest } = await import("./src/server/telegramHandler.ts");
              const parsed = JSON.parse(body || '{"action":"check_bot"}');
              const result = await handleTelegramRequest(parsed);
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message || "Telegram handler failed" }));
            }
          });
          return;
        }

        if (url === "/mcp" || url === "/api/a2a") {
          let body = "";
          req.on("data", (c: any) => { body += c; });
          req.on("end", () => {
            let parsed = {};
            try { parsed = JSON.parse(body || "{}"); } catch {}
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(handleMcpJsonRpc(parsed)));
          });
          return;
        }

        if (url === "/.well-known/api-catalog") {
          res.setHeader("Content-Type", "application/linkset+json; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
        } else if (url.startsWith("/.well-known/") && !url.endsWith(".md") && !url.endsWith(".zone")) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
        } else if (url === "/auth.md" || url.endsWith("/SKILL.md")) {
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
        }

        const canonicalPath = url === "/" ? "https://predictpro.guru/" : `https://predictpro.guru${url}`;
        const linkHeader = buildLinkHeader(canonicalPath);
        res.setHeader("Link", linkHeader);
        res.setHeader("Vary", "Accept");
        res.setHeader("Content-Signal", "ai-train=yes, search=yes, ai-input=yes");

        const accept = String(req.headers["accept"] || "").toLowerCase();
        if (accept.includes("text/markdown") && !url.startsWith("/api/") && !url.startsWith("/src/") && !url.startsWith("/@")) {
          const { markdown, tokens } = buildMarkdownForRoute(url || "/");
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          res.setHeader("X-Markdown-Tokens", String(tokens));
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.statusCode = 200;
          res.end(markdown);
          return;
        }

        if (url === "/h2u74xmxq17qqj7na6p7g5w29zwrhhq7.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.setHeader("X-Robots-Tag", "all");
          res.statusCode = 200;
          res.end("h2u74xmxq17qqj7na6p7g5w29zwrhhq7");
          return;
        }
        if (url === "/f7qprb5m24wrvjdmkspy56hhvjmhkcn5.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.statusCode = 200;
          res.end("f7qprb5m24wrvjdmkspy56hhvjmhkcn5");
          return;
        }
        if (url.startsWith("/api/") && (url.endsWith("-cron") || url.includes("/cron") || url === "/api/indexing-cron")) {
          try {
            const { handleCronTask } = await import("./src/server/cronApiHandler.ts");
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
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://bhgjlhgevyggkhyytulv.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ'
    ),
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: false,
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
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (d) =>
            !d.includes("vendor-charts") &&
            !d.includes("standingsData") &&
            !d.includes("MatchAnalyticsModal") &&
            !d.includes("AdvancedMarketsTab")
        ),
    },
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
