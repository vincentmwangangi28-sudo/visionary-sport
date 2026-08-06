# PredictPro Release Checklist

Run through this before every publish. Anything unchecked blocks the release.

## 1. Build & types

- [ ] `npm run build` succeeds with no warnings introduced by this release
- [ ] TypeScript typecheck is clean
- [ ] Browser console on `/`, `/today`, `/news`, `/insights` shows no errors

## 2. SEO landmarks & metadata

Check each page below in the rendered DOM (not just the source):

- [ ] Exactly **one** `<h1>` per route
- [ ] Exactly **one** `<main>` landmark per route, wrapping the primary content
- [ ] `<title>` under 60 chars, unique per route, contains the target keyword
- [ ] `<meta name="description">` under 160 chars, unique per route
- [ ] Canonical URL points at the production origin (no preview host)
- [ ] `og:title`, `og:description`, `og:type`, `twitter:card` present
- [ ] All images have descriptive `alt` text; below-fold images lazy-load
- [ ] JSON-LD validates (SportsEvent / NewsArticle / FAQPage / Article)

Routes to verify: `/`, `/today`, `/news`, `/insights`, `/leaderboard`, `/performance`,
`/shop`, `/about`, `/guides/mathematical-football-predictions`, `/match/:id`.

Crawl surface:

- [ ] `public/sitemap.xml` includes every public route added in this release
- [ ] `public/robots.txt` allows those routes and references the sitemap
- [ ] `public/llms.txt` reflects current features

## 3. Lighthouse metrics (mobile, published URL)

Run Lighthouse against the **published** URL after deploy — preview builds are not representative.

| Metric | Target |
| --- | --- |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | 100 |
| LCP | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| TBT | ≤ 200 ms |

- [ ] Scores meet the targets above on mobile
- [ ] LCP element is the hero heading/image, not an ad slot or late-loading widget
- [ ] AdSense script does not regress LCP or introduce layout shift

## 4. Data pipeline

- [ ] `fetch-upcoming-matches` returns 200 and cache rows are fresh (< 24 h)
- [ ] `fetch-live-matches` returns live or clearly-labelled demo data
- [ ] Daily prediction generation ran (check `job_runs` and AI credit balance)
- [ ] Cron schedules for daily 08:00 EAT automation are enabled

## 5. Security & auth

- [ ] Security scan has no critical or error-level findings
- [ ] RLS: no table exposes per-user rows to `anon`
- [ ] Sign-in works for email/password, magic link, and Google
- [ ] OAuth consent route `/.lovable/oauth/consent` loads and preserves `next`

## 6. MCP endpoint

- [ ] `.lovable/mcp/manifest.json` regenerated after any tool change
- [ ] MCP requires OAuth (no anonymous tool calls)
- [ ] Tool list responds on the published function URL
- [ ] Tools that read user data return only the caller's rows

## 7. Compliance

- [ ] 18+ / Responsible Gaming disclaimer visible in footer
- [ ] Terms and Privacy Policy links resolve
- [ ] Analytics redacts PII

## 8. Post-publish

- [ ] Published URL loads and serves the new build
- [ ] Sitemap resubmitted to Search Console
- [ ] Spot-check one prediction, one news article, and one match detail page
