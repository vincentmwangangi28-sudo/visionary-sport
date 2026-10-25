# PredictPro — Phase 6: Server-Side SEO, Live Match Sitemaps & Autonomous Search Indexing Plan

## 1. Context & Objective
While PredictPro currently manages client-side `<head>` tags and Schema.org structured data after React mounts, non-JavaScript search crawlers and social link previewers (WhatsApp, Telegram, X/Twitter, Facebook, Discord, and rapid news indexers) inspect the raw initial HTML response. Furthermore, our XML sitemaps and automated IndexNow dispatcher currently push a static list of hubs rather than dynamically harvesting every live and upcoming ESPN match fixture across our 20+ global and African leagues.

Phase 6 upgrades PredictPro into a **server-prerendered, self-indexing sports intelligence publisher** where every route—including dynamic match predictions (`/predict/{home-vs-away}`), club analytics hubs (`/teams/{slug}`), player xG profiles (`/players/{slug}`), and regional jackpot calculators—delivers complete server-injected `<head>` metadata, dynamic `/api/og` social cards, live XML sitemaps, and automated IndexNow search engine dispatches.

---

## 2. Visual Direction & Architectural Blueprint
Our SEO Command Center (`/seo-indexing`) and social share cards follow the **Dark Sports Analytics Broadcast Studio** aesthetic (`#060A12` obsidian canvas, `#10B981` emerald telemetry accents, `Space Grotesk` headings, and `JetBrains Mono` structured data inspectors).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   INCOMING CRAWLER / SOCIAL BOT REQUEST                    │
│     (Googlebot, Bingbot, IndexNow, WhatsApp, Telegram, X Card Validator)   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            1. SERVER-SIDE HTML <HEAD> & JSON-LD PRERENDER ENGINE           │
│  • Intercepts route requests (/predict/:slug, /teams/:slug, /jackpot, etc) │
│  • Resolves live ESPN fixture or hub metadata on the server                │
│  • Injects route-specific <title>, <meta description>, canonical URL,      │
│    dynamic /api/og social card URL, and Schema.org SportsEvent JSON-LD     │
└─────────────────┬───────────────────────────────────────┬──────────────────┘
                  │                                       │
                  ▼                                       ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────────┐
│  2. DYNAMIC XML SITEMAPS & FEEDS    │ │ 3. AUTONOMOUS INDEXNOW DISPATCHER  │
│  • /sitemap-matches.xml (Live ESPN) │ │ • Harvests 60–120+ live/upcoming   │
│  • /sitemap-discover-news.xml       │ │   ESPN match & team slugs per run  │
│  • /feed-predictions.xml (RSS/Atom) │ │ • Pushes batch to api.indexnow.org │
│  • Regional hreflang & news tags    │ │ • Exposes live telemetry to UI     │
└─────────────────┬───────────────────┘ └─────────────────┬──────────────────┘
                  │                                       │
                  └───────────────────┬───────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│              4. INTERACTIVE SEO COMMAND CENTER (/seo-indexing)             │
│  • Live Server Prerender & Schema.org JSON-LD Inspector                    │
│  • Dynamic Social Share Card (/api/og) Visual Preview Studio               │
│  • Live ESPN Match Slug Sitemap & IndexNow Queue Monitor                   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Functional Workstreams

### Workstream 1: Server-Side Dynamic `<head>`, OpenGraph & Schema.org JSON-LD Prerender Engine
- **Route-Aware HTML Interceptor**:
  - Upgrade the server HTML pipeline so requests to any application route receive immediate, server-injected `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:*`, and `twitter:*` tags before the browser or crawler executes a single line of JavaScript.
- **Dynamic Match & Club Resolution**:
  - When a request arrives for `/predict/{slug}` (e.g., `/predict/arsenal-vs-real-madrid`) or `/teams/{slug}`, parse the slug against the live ESPN fixture cache (or deterministic club metadata) to populate exact team names, league context, kickoff date, 1X2 model edge, and dynamic `/api/og?title=...&home=...&away=...` social card URLs.
- **Server-Injected Structured Data (`application/ld+json`)**:
  - Inject valid Schema.org `SportsEvent` (with `homeTeam`, `awayTeam`, `startDate`, `location`, and `eventStatus`), `WebApplication`, `Organization`, `BreadcrumbList`, and `FAQPage` JSON-LD blocks directly into the initial HTML payload.
- **Global, African & European High-Intent Keyword Matrix**:
  - Enrich route metadata with high-converting regional and analytical search terms (`AI football predictions today`, `Expected Goals xG calculator`, `SportPesa & Betika 17-game Mega Jackpot mathematical tips`, `Premier League`, `UEFA Champions League`, `CAF Champions League`, `FKF Premier League`, `South African PSL`, `NPFL`).

### Workstream 2: Live ESPN Match XML Sitemaps & Google Discover / RSS Feeds
- **Dynamic Server XML Endpoints**:
  - Serve live, dynamically generated XML endpoints directly from the server middleware so search engines always crawl the latest match fixtures without requiring a static rebuild:
    - `/sitemap-matches.xml`: Dynamically lists all active and upcoming ESPN match prediction URLs (`/predict/{home-vs-away}`) and participating club hubs (`/teams/{slug}`) with `<lastmod>`, `<changefreq>hourly</changefreq>`, and `<priority>0.9</priority>`.
    - `/sitemap-discover-news.xml`: Google News & Google Discover compliant XML sitemap featuring `<news:news>`, `<news:publication_date>`, and `<image:image>` tags pointing to each match's dynamic `/api/og` graphic.
    - `/feed-predictions.xml`: Real-time RSS 2.0 / Atom syndication feed of today's top AI match predictions and value edges for news aggregators.
- **Build-Time Sitemap Generator Synchronization**:
  - Update the build-time sitemap generation script so static deployments also bundle live ESPN fixtures alongside all 90+ evergreen hub routes.

### Workstream 3: Automated IndexNow & Search Engine Crawl Dispatcher for Live ESPN Slugs
- **Live Fixture Harvesting in Cron Pipeline**:
  - Upgrade the `/api/indexing-cron` (`google-crawl` / `indexing`) handler from a static 12-URL list to dynamically query active and upcoming ESPN fixtures across all supported leagues.
  - Construct canonical URLs for every live/upcoming match (`/predict/{home-vs-away}`), active team hub (`/teams/{team-slug}`), and high-priority jackpot/market pages, submitting the complete batch (60–150+ URLs) to IndexNow (`api.indexnow.org`) and search engine sitemap ping endpoints.
- **Detailed Execution Telemetry**:
  - Return structured payload metrics from `/api/indexing-cron` including total URLs submitted, breakdown of static hubs vs. live ESPN match slugs, HTTP status codes from IndexNow, and a sample list of newly indexed match URLs.

### Workstream 4: Interactive SEO Command Center Upgrade (`/seo-indexing`)
- **Public & Admin Accessibility**:
  - Make the SEO Command Center accessible with an interactive **Live Server Prerender & Schema.org Inspector** where users can select any live ESPN fixture or hub route and inspect the exact server-rendered `<head>` tags, JSON-LD `SportsEvent` schema, and live `/api/og` OpenGraph social card preview.
- **Live ESPN Match Sitemap & IndexNow Queue Monitor**:
  - Display real-time counts and searchable tables of the live ESPN `/predict/{slug}` and `/teams/{slug}` URLs currently active in `/sitemap-matches.xml` and queued for IndexNow dispatch, complete with one-click **"Ping IndexNow with Live ESPN Slugs"** and **"Inspect Live `/sitemap-matches.xml`"** actions.

---

## 4. Verification & Acceptance Criteria
- **Zero-JS Crawler Verification**: Fetching `/predict/arsenal-vs-chelsea`, `/jackpot-generator`, or `/teams/arsenal` returns server-injected `<title>`, `<meta property="og:image" content=".../api/og?...">`, and `<script type="application/ld+json">` with `SportsEvent` schema in the raw HTML response.
- **Live XML Sitemap & RSS Verification**: Requesting `/sitemap-matches.xml`, `/sitemap-discover-news.xml`, and `/feed-predictions.xml` returns valid XML populated with current ESPN fixtures.
- **IndexNow Live Batch Dispatch**: Triggering `/api/indexing-cron?task=indexing` dynamically harvests and submits all current ESPN match prediction URLs alongside core hubs and returns the live count to the UI.
- **Clean Build & Lint**: Full TypeScript compilation and linter checks pass with zero errors.
