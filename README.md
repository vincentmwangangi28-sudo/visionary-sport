# PredictPro — AI Football Predictions, Expected Goals (xG) & Betting Analytics

[![Netlify Status](https://api.netlify.com/api/v1/badges/4d5e7d5d-0202-4c3c-99a8-4986b0ba9b58/deploy-status)](https://app.netlify.com/projects/predictproguru/deploys)

**Live Production URL**: [https://predictpro.guru](https://predictpro.guru)  
**Netlify Project**: [`predictproguru`](https://app.netlify.com/projects/predictproguru/deploys) (`4d5e7d5d-0202-4c3c-99a8-4986b0ba9b58`)  
**GitHub Repository**: [`github.com/vincentmwangangi28-sudo/visionary-sport`](https://github.com/vincentmwangangi28-sudo/visionary-sport)

---

## Continuous Deployment (Netlify)

This repository is linked to **Netlify Continuous Deployment** on the `main` branch:

| Setting | Value |
| :--- | :--- |
| **Base directory** | `/` |
| **Build command** | `bun run build` (or `npm run build`) |
| **Publish directory** | `dist` |
| **Functions directory** | `netlify/functions` |
| **Node.js version** | `24.x` (Ubuntu Noble 24.04) |
| **Production branch** | `main` |
| **Pretty URLs** | Enabled |

---

## Domain & DNS Configuration (`predictpro.guru`)

### DNS Records
| Name | TTL | Class | Type | Value |
| :--- | :--- | :--- | :--- | :--- |
| `predictpro.guru` | `3600` | `IN` | `A` | `75.2.60.5` |
| `www.predictpro.guru` | `3600` | `IN` | `CNAME` | `predictproguru.netlify.app` |

### Netlify Managed DNS Name Servers (NS1)
Point your domain registrar's custom name servers for `predictpro.guru` to:
1. `dns1.p07.nsone.net`
2. `dns2.p07.nsone.net`
3. `dns3.p07.nsone.net`
4. `dns4.p07.nsone.net`

> **Preventing `ERR_TOO_MANY_REDIRECTS` on Netlify**:
> 1. In `netlify.toml` and `public/_redirects`, host-level `www` $\leftrightarrow$ apex `301!` rules have been removed because Netlify's **Domain management** handles `www` and `predictpro.guru` primary-domain redirects natively at the edge.
> 2. In your DNS settings, set `www.predictpro.guru` `CNAME` to **`predictproguru.netlify.app`** (or in Netlify **Domain management $\rightarrow$ Production domains**, click **Options $\rightarrow$ Set as primary domain** on `predictpro.guru`).

---

## Build Pipeline (`bun run build` / `npm run build`)
1. **`vite build`**: Compiles the React 18 + TypeScript + Tailwind CSS bundle into `dist/`.
2. **`node scripts/generate-sitemap.mjs`**: Generates `sitemap.xml`, `sitemap-index.xml`, `sitemap-core.xml`, `sitemap-leagues.xml`, `sitemap-matches.xml`, `sitemap-blog.xml`, `sitemap-discover-news.xml`, `sitemap-yandex.xml`, and RSS feeds (`242` self-canonicalized URLs).
3. **`node scripts/prerender-seo-routes.mjs`**: Pre-renders all `242` routes into both `dist/<route>/index.html` and `dist/<route>.html` with route-specific `<title>`, `<meta name="description">`, `<link rel="canonical">`, single `<h1>`, and JSON-LD structured data (`WebSite`, `SportsOrganization`, `Article`, `Product`, `ItemList`, `FAQPage`, `Dataset`).

---

## Local Development

```sh
# 1. Install dependencies
npm install

# 2. Start the development server on port 3000
npm run dev

# 3. Run full production build + SEO prerender
npm run build
```
