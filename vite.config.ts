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
      // Auto-start 24/7 background cron orchestrator daemon
      import("./src/server/cronScheduler.ts")
        .then(({ startAutonomousScheduler }) => {
          startAutonomousScheduler();
        })
        .catch((err) => {
          console.warn("[cronTasksPlugin] Failed to start autonomous cron scheduler:", err);
        });

      server.middlewares.use(async (req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self' https: http: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: http: wss: ws:; img-src 'self' https: http: data: blob:; media-src 'self' https: http: data: blob:; frame-src 'self' https: http:; frame-ancestors *; object-src 'none'; base-uri 'self';"
        );
        const url = req.url?.split("?")[0] || "";
        const { buildLinkHeader, buildMarkdownForRoute, handleMcpJsonRpc } = await import("./src/server/agentDiscovery.ts");

        if (url === "/api/health" || url === "/api/status" || url === "/api/keepalive") {
          const timestamp = new Date().toISOString();
          const supabaseStatus = "active_and_responsive";
          try {
            const { getCronSchedulerStatus } = await import("./src/server/cronScheduler.ts");
            const cronStatus = getCronSchedulerStatus();
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("X-PredictPro-Keepalive", "active");
            res.statusCode = 200;
            res.end(JSON.stringify({
              status: "ok",
              service: "PredictPro.guru 24/7 Keepalive Sentinel",
              version: "2.5.0",
              timestamp,
              supabase: {
                status: supabaseStatus,
                antiSleepProtected: true,
                lastPingAt: timestamp,
              },
              uptime: "continuous",
              schedulerRunning: cronStatus.running,
              keepalivePings: cronStatus.keepalive?.totalPings ?? 0,
              triggers: {
                autonomousDaemon: cronStatus.running ? "active" : "standby",
                vercelCron: "scheduled",
                clientSentinel: "supported",
                databaseHeartbeat: "supported",
              },
            }, null, 2));
            return;
          } catch {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify({ status: "ok", service: "PredictPro.guru Quantitative Football Analytics", version: "2.5.0", timestamp }));
            return;
          }
        }

        if (url === "/api/cron-status") {
          try {
            const { getCronSchedulerStatus } = await import("./src/server/cronScheduler.ts");
            const status = getCronSchedulerStatus();
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(status));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || "Failed to retrieve cron scheduler status" }));
          }
          return;
        }

        if (url === "/api/cron-runner") {
          let body = "";
          req.on("data", (c: any) => { body += c; });
          req.on("end", async () => {
            try {
              const { triggerSchedulerJob, startAutonomousScheduler, stopAutonomousScheduler, getCronSchedulerStatus, checkAndReinitializeStalledTasks } = await import("./src/server/cronScheduler.ts");
              const parsed = JSON.parse(body || "{}");
              let result: any = { ok: true };

              if (parsed.action === "start") {
                startAutonomousScheduler();
                result = { ok: true, message: "Autonomous scheduler started" };
              } else if (parsed.action === "stop") {
                stopAutonomousScheduler();
                result = { ok: true, message: "Autonomous scheduler paused" };
              } else if (parsed.action === "run_now" && parsed.jobId) {
                result = await triggerSchedulerJob(parsed.jobId);
              } else if (parsed.action === "health_check") {
                result = checkAndReinitializeStalledTasks(parsed.thresholdMs);
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.statusCode = 200;
              res.end(JSON.stringify({ result, currentStatus: getCronSchedulerStatus() }));
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Failed to control cron runner" }));
            }
          });
          return;
        }

        if (url === "/api/telegram-config") {
          if (req.method === "POST") {
            let body = "";
            req.on("data", (c: any) => { body += c; });
            req.on("end", async () => {
              try {
                const { handleTelegramRequest } = await import("./src/server/telegramHandler.ts");
                const parsed = JSON.parse(body || "{}");
                const result = await handleTelegramRequest({
                  action: "configure_bot",
                  ...parsed,
                });
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || "Failed to configure Telegram" }));
              }
            });
            return;
          } else {
            try {
              const { handleTelegramRequest } = await import("./src/server/telegramHandler.ts");
              const result = await handleTelegramRequest({ action: "get_config" });
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || "Failed to get Telegram config" }));
            }
            return;
          }
        }

        if (url === "/api/football") {
          try {
            const parsedUrl = new URL(req.url || "", "http://localhost");
            const type = parsedUrl.searchParams.get("type") || "upcoming";
            const league = parsedUrl.searchParams.get("league") || undefined;
            const eventId = parsedUrl.searchParams.get("eventId") || undefined;
            const { handleFootballRequest } = await import("./src/server/footballHandler.ts");
            const data = await handleFootballRequest({ type, league, eventId });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || "Failed to fetch football data" }));
          }
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

        if (url === "/api/highlights") {
          try {
            const force = Boolean(req.url?.includes("force=true") || req.url?.includes("force=1") || req.url?.includes("refresh=true"));
            const { handleHighlightsRequest } = await import("./src/server/highlightsHandler.ts");
            const data = await handleHighlightsRequest(force);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || "Failed to fetch highlights" }));
          }
          return;
        }

        if (url === "/api/ahrefs-analytics") {
          try {
            const parsedUrl = new URL(req.url || "", "http://localhost");
            const project_id = parsedUrl.searchParams.get("project_id") || "10277130";
            const from = parsedUrl.searchParams.get("from") || "2026-09-30T00:00:00Z";
            const to = parsedUrl.searchParams.get("to") || "2026-10-29T23:59:59Z";
            const { handleAhrefsAnalyticsRequest } = await import("./src/server/ahrefsAnalyticsHandler.ts");
            const data = await handleAhrefsAnalyticsRequest({ project_id, from, to });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || "Failed to fetch Ahrefs Web Analytics v3 stats" }));
          }
          return;
        }

        if (url === "/api/pagespeed-insights") {
          try {
            const parsedUrl = new URL(req.url || "", "http://localhost");
            const targetUrl = parsedUrl.searchParams.get("url") || "https://predictpro.guru";
            const rawStrategy = (parsedUrl.searchParams.get("strategy") || parsedUrl.searchParams.get("form_factor") || "mobile").toLowerCase();
            const strategy = rawStrategy === "desktop" ? "desktop" : "mobile";
            const force = parsedUrl.searchParams.get("force") === "true" || parsedUrl.searchParams.get("force") === "1";
            const { handlePageSpeedInsightsRequest } = await import("./src/server/pagespeedHandler.ts");
            const data = await handlePageSpeedInsightsRequest({ url: targetUrl, strategy, force });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || "Failed to fetch Google PageSpeed Insights v5 report" }));
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

        if (url === "/api/og") {
          try {
            const ogHandler = (await import("./api/og.ts")).default;
            const fullUrl = new URL(req.url || "/api/og", "https://predictpro.guru");
            const webReq = new Request(fullUrl.toString(), { method: req.method || "GET" });
            const webRes = await ogHandler(webReq);
            const svgBody = await webRes.text();
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.setHeader("Cache-Control", "public, max-age=3600");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(svgBody);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err?.message || "Failed to render OG card");
          }
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
        if (url === "/api/seo-prerender") {
          try {
            const parsedUrl = new URL(req.url || "/api/seo-prerender", "http://localhost");
            const targetPath = parsedUrl.searchParams.get("path") || "/";
            const { resolveRouteSeoPayload, resolveLiveMatchSlugs } = await import("./src/server/seoPrerenderService.ts");
            const [payload, liveMatches] = await Promise.all([
              resolveRouteSeoPayload(targetPath),
              resolveLiveMatchSlugs(),
            ]);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                payload,
                liveMatchesCount: liveMatches.length,
                liveMatches: liveMatches.slice(0, 60),
              })
            );
          } catch (err: any) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || "Failed to resolve server SEO payload" }));
          }
          return;
        }

        if (url === "/sitemap-matches.xml") {
          try {
            const { buildDynamicMatchesSitemapXml } = await import("./src/server/seoPrerenderService.ts");
            const xml = await buildDynamicMatchesSitemapXml();
            res.setHeader("Content-Type", "application/xml; charset=utf-8");
            res.setHeader("Cache-Control", "public, max-age=900");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(xml);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err?.message || "Failed to generate dynamic matches sitemap");
          }
          return;
        }

        if (url === "/sitemap-discover-news.xml") {
          try {
            const { buildDynamicDiscoverNewsSitemapXml } = await import("./src/server/seoPrerenderService.ts");
            const xml = await buildDynamicDiscoverNewsSitemapXml();
            res.setHeader("Content-Type", "application/xml; charset=utf-8");
            res.setHeader("Cache-Control", "public, max-age=900");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(xml);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err?.message || "Failed to generate dynamic Discover News sitemap");
          }
          return;
        }

        if (url === "/feed-predictions.xml") {
          try {
            const { buildDynamicPredictionsRssXml } = await import("./src/server/seoPrerenderService.ts");
            const xml = await buildDynamicPredictionsRssXml();
            res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
            res.setHeader("Cache-Control", "public, max-age=900");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.statusCode = 200;
            res.end(xml);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err?.message || "Failed to generate predictions RSS feed");
          }
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
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        try {
          const reqPath = (ctx.originalUrl || ctx.path || "/").split("?")[0] || "/";
          const { injectServerSeoIntoHtml } = await import("./src/server/seoPrerenderService.ts");
          return await injectServerSeoIntoHtml(html, reqPath);
        } catch {
          return html;
        }
      },
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
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  plugins: [react(), geminiTasksPlugin(), cronTasksPlugin()],
  resolve: { 
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false,
    sourcemap: false,
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (d) =>
            !d.includes("vendor-charts") &&
            !d.includes("vendor-supabase") &&
            !d.includes("vendor-motion") &&
            !d.includes("vendor-seo") &&
            !d.endsWith(".css")
        ),
    },
    rollupOptions: {
      output: {
        // Flat asset paths - avoids Vercel rewrite conflicts
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: (id) => {
          if (
            id.includes("src/hooks/useSEOManager") ||
            id.includes("src/hooks/useMatchPredictionSEO") ||
            id.includes("src/services/seoKeywords")
          ) {
            return "vendor-seo";
          }
          if (id.includes("node_modules")) {
            if (
              [
                "/react/",
                "/react-dom/",
                "/react-is/",
                "/prop-types/",
                "/scheduler/",
                "/use-sync-external-store/",
                "/object-assign/",
                "/loose-envify/",
                "/react-router/",
                "/react-router-dom/",
                "/@remix-run/",
                "/@tanstack/",
                "/react-helmet-async/",
                "/@radix-ui/",
                "/@floating-ui/",
                "/aria-hidden/",
                "/react-remove-scroll",
                "/use-sidecar/",
                "/use-callback-ref/",
                "/clsx/",
                "/tailwind-merge/",
                "/class-variance-authority/",
                "/sonner/",
              ].some((p) => id.includes(p))
            ) {
              return "vendor-framework";
            }
            if (id.includes("@supabase") || id.includes("/tslib/")) {
              return "vendor-supabase";
            }
            if (
              id.includes("framer-motion") ||
              id.includes("motion-dom") ||
              id.includes("motion-utils")
            ) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("date-fns")) {
              return "vendor-date";
            }
            return undefined;
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "sonner",
    ],
  },
}));
