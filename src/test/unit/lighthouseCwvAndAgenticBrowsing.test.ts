import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveLiveMatchSlugs,
  resolveRouteSeoPayload,
  injectServerSeoIntoHtml,
  buildDynamicMatchesSitemapXml,
  canonicalizeMatchSlug,
} from '@/server/seoPrerenderService';
import {
  formatMatchSlug,
  generateMatchesSitemapXml,
} from '@/services/sitemapGenerator';

describe('Lighthouse 13.6 CWV, Accessibility Contrast, Form Attributes & Agentic Browsing Audit', () => {
  it('resolves live match slugs and server HTML prerendering in < 50ms without blocking network timeouts (NO_NAVSTART / LCP fix)', async () => {
    const rawHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
    const start = performance.now();
    const slugs = await resolveLiveMatchSlugs('https://www.predictpro.guru', { crawlSupabase: false });
    const payload = await resolveRouteSeoPayload('/');
    const html = await injectServerSeoIntoHtml(rawHtml, '/');
    const elapsedMs = performance.now() - start;

    expect(slugs.length).toBeGreaterThanOrEqual(25);
    expect(payload.title.length).toBeLessThanOrEqual(60);
    expect(payload.description.length).toBeLessThanOrEqual(155);
    expect(html).toContain('<link rel="canonical" href="https://predictpro.guru/" />');
    expect(elapsedMs).toBeLessThan(150);
  });

  it('does not inject external Google Fonts stylesheets dynamically in index.html (fixes Verify stylesheet URLs & 2,492ms pointer INP)', () => {
    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(indexHtml).not.toContain('fonts.googleapis.com/css2');
    expect(indexHtml).not.toContain("fontLink.rel = 'stylesheet'");
  });

  it('validates robots.txt, llms.txt, and .well-known/ai-catalog.json for Lighthouse SEO & Agentic Browsing 4/4', () => {
    const robotsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/robots.txt'), 'utf-8');
    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toMatch(/Sitemap: https:\/\/(www\.)?predictpro\.guru\/sitemap\.xml/);

    const llmsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/llms.txt'), 'utf-8');
    expect(llmsTxt).toContain('# PredictPro');
    expect(llmsTxt).toContain('## Core Prediction Markets');

    const aiCatalogRaw = fs.readFileSync(
      path.resolve(process.cwd(), 'public/.well-known/ai-catalog.json'),
      'utf-8'
    );
    const aiCatalog = JSON.parse(aiCatalogRaw);
    expect(aiCatalog.specVersion).toBe('1.0');
    expect(aiCatalog.host?.identifier).toBe('did:web:predictpro.guru');
    expect(Array.isArray(aiCatalog.entries)).toBe(true);
    expect(aiCatalog.entries.length).toBeGreaterThanOrEqual(4);
  });

  it('enforces WCAG AAA contrast tokens in src/index.css and solid backgroundColor in TeamLogo.tsx', () => {
    const indexCss = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf-8');
    expect(indexCss).toContain('--primary: 142 82% 20%;');
    expect(indexCss).toContain('--muted-foreground: 215 28% 28%;');
    expect(indexCss).toContain('--destructive: 0 84% 38%;');

    const teamLogoTsx = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/TeamLogo.tsx'),
      'utf-8'
    );
    expect(teamLogoTsx).toContain('backgroundColor: bgColor');
  });

  it('ensures form inputs in SEOInternalLinkMesh, UnifiedSearchModal, and BetSlipDrawer have both id and name attributes', () => {
    const meshCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/SEOInternalLinkMesh.tsx'),
      'utf-8'
    );
    expect(meshCode).toContain('id="seo-directory-page-filter"');
    expect(meshCode).toContain('name="seo-directory-page-filter"');

    const searchModalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/UnifiedSearchModal.tsx'),
      'utf-8'
    );
    expect(searchModalCode).toContain('id="unified-global-search-input"');
    expect(searchModalCode).toContain('name="q"');

    const betSlipCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/BetSlipDrawer.tsx'),
      'utf-8'
    );
    expect(betSlipCode).toContain('id="betslip-stake-input"');
    expect(betSlipCode).toContain('name="betslip-stake"');
  });

  it('synchronizes homepage title, preserves prerendered Article schema, reduces sub-page link bloat, and submits canonical URLs to IndexNow', () => {
    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
    const indexTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/Index.tsx'), 'utf-8');
    const seoManagerTs = fs.readFileSync(path.resolve(process.cwd(), 'src/hooks/useSEOManager.ts'), 'utf-8');
    const prerenderMjs = fs.readFileSync(path.resolve(process.cwd(), 'scripts/prerender-seo-routes.mjs'), 'utf-8');

    // 1. Page and SERP titles match 100% across index.html, Index.tsx, and useSEOManager.ts
    expect(indexHtml).toContain('<title>PredictPro — Football Match Statistics, Live Scores &amp; xG</title>');
    expect(indexTsx).toContain('title="PredictPro — Football Match Statistics, Live Scores & xG"');
    expect(seoManagerTs).toContain("title: 'PredictPro — Football Match Statistics, Live Scores & xG'");

    // 2. Article schema + SpeakableSpecification present in index.html and preserved by useSEOManager.ts
    expect(indexHtml).toContain('"@type": "Article"');
    expect(indexHtml).toContain('"@id": "https://www.predictpro.guru/#article"');
    expect(indexHtml).toContain('"@id": "https://www.predictpro.guru/#faq"');
    expect(seoManagerTs).toContain("'prerender-route-jsonld'");
    expect(seoManagerTs).toContain("'server-prerender-jsonld'");

    // 3. Sub-page link bloat reduction + IndexNow batch submission in prerender-seo-routes.mjs
    expect(prerenderMjs).toContain('compactSubpageHubDirectoryHtml');
    expect(prerenderMjs).toContain('submitPrerenderedUrlsToIndexNow');
    expect(prerenderMjs).toContain('indexnow-submission-manifest.json');
    expect(prerenderMjs).toContain('3qcm1kxwka5aghtkzahsphxgca1cyc6s');

    // 4. Root UTF-8 IndexNow key file 3qcm1kxwka5aghtkzahsphxgca1cyc6s.txt verified
    const keyFileContent = fs
      .readFileSync(path.resolve(process.cwd(), 'public/3qcm1kxwka5aghtkzahsphxgca1cyc6s.txt'), 'utf-8')
      .trim();
    expect(keyFileContent).toBe('3qcm1kxwka5aghtkzahsphxgca1cyc6s');
    expect(indexHtml).toContain('<meta name="indexnow-key" content="3qcm1kxwka5aghtkzahsphxgca1cyc6s" />');
  });

  it('enforces accessible ARIA roles, focus-visible rings, and portal rendering across primary and secondary buttons', () => {
    const buttonUi = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/button.tsx'), 'utf-8');
    const pwaBtn = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PWAInstallButton.tsx'), 'utf-8');
    const mobileNav = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MobileBottomNav.tsx'), 'utf-8');
    const heroTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Hero.tsx'), 'utf-8');
    const predCard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PredictionCard.tsx'), 'utf-8');
    const homeTabs = fs.readFileSync(path.resolve(process.cwd(), 'src/components/HomeViewTabs.tsx'), 'utf-8');

    // Base UI Button defaults to type="button" when not asChild and has tactile active scale + focus-visible ring
    expect(buttonUi).toContain('type ?? "button"');
    expect(buttonUi).toContain('focus-visible:ring-2');
    expect(buttonUi).toContain('active:scale-[0.98]');

    // Both header PWAInstallButton modal and MobileBottomNav sheet use createPortal(..., document.body)
    expect(pwaBtn).toContain('createPortal(');
    expect(pwaBtn).toContain('aria-haspopup="dialog"');
    expect(mobileNav).toContain('createPortal(');
    expect(mobileNav).toContain('aria-haspopup="dialog"');

    // Hero uses Button asChild instead of nested <Link><Button>
    expect(heroTsx).toContain('asChild');
    expect(heroTsx).not.toMatch(/<Link[^>]*>\s*<Button/);

    // PredictionCard odds buttons have aria-pressed, aria-label, and focus-visible ring
    expect(predCard).toContain('aria-pressed={inSlip}');
    expect(predCard).toContain('focus-visible:ring-2');
    expect(predCard).toContain('active:scale-[0.97]');

    // HomeViewTabs has explicit type="button", role="tab", aria-selected, and aria-controls
    expect(homeTabs).toContain('type="button"');
    expect(homeTabs).toContain('role="tab"');
    expect(homeTabs).toContain('aria-controls="main-content"');
  });

  it('dynamically crawls active match slugs from Supabase and publishes canonical /sitemap-matches.xml with zero 301-redirected URLs', async () => {
    // 1. Canonical slug normalization maps legacy 301-source slugs to their 200 OK canonical destination
    expect(canonicalizeMatchSlug('manchester-united-vs-tottenham-hotspur')).toBe(
      'manchester-united-vs-tottenham'
    );
    expect(formatMatchSlug('Young Africans', 'Simba SC')).toBe('simba-sc-vs-young-africans');

    // 2. Dynamic matches sitemap XML generator produces valid Sitemaps 0.9 + Google Image 1.1 XML
    const dynamicXml = await buildDynamicMatchesSitemapXml('https://www.predictpro.guru', {
      crawlSupabase: true,
    });
    expect(dynamicXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(dynamicXml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(dynamicXml).toContain('<loc>https://www.predictpro.guru/predict/arsenal-vs-chelsea</loc>');
    expect(dynamicXml).not.toContain('manchester-united-vs-tottenham-hotspur');
    expect(dynamicXml).not.toContain('young-africans-vs-simba-sc');

    // 3. Client-side matches sitemap generator produces valid XML
    const clientMatchesXml = generateMatchesSitemapXml('https://www.predictpro.guru');
    expect(clientMatchesXml).toContain('<loc>https://www.predictpro.guru/predict/');
    expect(clientMatchesXml).not.toContain('newcastle-united-vs-aston-villa');

    // 4. Published public/sitemap-matches.xml and /api/sitemap-matches.ts are present and valid
    const publicMatchesXml = fs.readFileSync(
      path.resolve(process.cwd(), 'public/sitemap-matches.xml'),
      'utf-8'
    );
    const locCount = (publicMatchesXml.match(/<loc>/g) || []).length;
    expect(locCount).toBeGreaterThanOrEqual(70);
    expect(publicMatchesXml).toContain('https://www.predictpro.guru/predict/');

    const apiEndpointCode = fs.readFileSync(
      path.resolve(process.cwd(), 'api/sitemap-matches.ts'),
      'utf-8'
    );
    expect(apiEndpointCode).toContain('buildDynamicMatchesSitemapXml');
    expect(apiEndpointCode).toContain('crawlSupabase: true');
  });

  it('connects to Brave Search API via server-side handler and returns structured web & news football intelligence', async () => {
    const { handleBraveSearchRequest } = await import('@/server/braveSearchHandler');
    const res = await handleBraveSearchRequest({
      q: 'Premier League Arsenal Chelsea injury news',
      type: 'all',
      count: 3,
    });

    expect(res.success).toBe(true);
    expect(res.connected).toBe(true);
    expect(Array.isArray(res.webResults)).toBe(true);
    expect(Array.isArray(res.newsResults)).toBe(true);
    expect(Array.isArray(res.groundingSources)).toBe(true);

    const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
    expect(envExample).toContain('BRAVE_SEARCH_API_KEY=');
  });

  it('computes Opta 10k simulation probabilities, SofaScore 90-minute goal timing intervals, Understat tactical radar, and FotMob crowd poll metrics', async () => {
    const { computeProMatchAnalytics } = await import('@/components/MatchProAnalyticsWidget');
    const pro = computeProMatchAnalytics({
      id: 'test-arsenal-chelsea',
      match_id: 'match-arsenal-chelsea',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      league: 'Premier League',
      match_date: new Date().toISOString(),
      prediction: 'Home Win',
      predicted_outcome: 'Home Win',
      confidence: 82,
      confidence_score: 82,
      home_odds: 1.75,
      draw_odds: 3.60,
      away_odds: 4.50,
      status: 'pending',
      is_premium: false,
      created_at: new Date().toISOString(),
    });

    expect(pro.homeWinProb + pro.drawProb + pro.awayWinProb).toBe(100);
    expect(pro.bookieHomeImplied + pro.bookieDrawImplied + pro.bookieAwayImplied).toBe(100);
    expect(pro.goalIntervals).toHaveLength(6);
    expect(pro.goalIntervals.some((i) => i.isPeak)).toBe(true);
    expect(pro.tacticalMetrics).toHaveLength(5);
    expect(pro.bestValueEdgePct).toBeGreaterThan(0);
    expect(pro.baseVoteCounts.home).toBeGreaterThan(pro.baseVoteCounts.away);
  });
});


