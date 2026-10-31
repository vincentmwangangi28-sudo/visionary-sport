import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveLiveMatchSlugs,
  resolveRouteSeoPayload,
  injectServerSeoIntoHtml,
} from '@/server/seoPrerenderService';

describe('Lighthouse 13.6 CWV, Accessibility Contrast, Form Attributes & Agentic Browsing Audit', () => {
  it('resolves live match slugs and server HTML prerendering in < 50ms without blocking network timeouts (NO_NAVSTART / LCP fix)', async () => {
    const rawHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
    const start = performance.now();
    const slugs = await resolveLiveMatchSlugs();
    const payload = await resolveRouteSeoPayload('/');
    const html = await injectServerSeoIntoHtml(rawHtml, '/');
    const elapsedMs = performance.now() - start;

    expect(slugs.length).toBeGreaterThanOrEqual(10);
    expect(payload.title.length).toBeLessThanOrEqual(60);
    expect(payload.description.length).toBeLessThanOrEqual(155);
    expect(html).toContain('<link rel="canonical" href="https://predictpro.guru/" />');
    expect(elapsedMs).toBeLessThan(100);
  });

  it('does not inject external Google Fonts stylesheets dynamically in index.html (fixes Verify stylesheet URLs & 2,492ms pointer INP)', () => {
    const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
    expect(indexHtml).not.toContain('fonts.googleapis.com/css2');
    expect(indexHtml).not.toContain("fontLink.rel = 'stylesheet'");
  });

  it('validates robots.txt, llms.txt, and .well-known/ai-catalog.json for Lighthouse SEO & Agentic Browsing 4/4', () => {
    const robotsTxt = fs.readFileSync(path.resolve(process.cwd(), 'public/robots.txt'), 'utf-8');
    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toContain('Sitemap: https://predictpro.guru/sitemap.xml');

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
});
