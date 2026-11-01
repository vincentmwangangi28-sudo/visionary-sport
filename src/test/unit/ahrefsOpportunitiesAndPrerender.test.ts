import { describe, it, expect } from 'vitest';
import {
  AHREFS_12_OPPORTUNITY_PILLARS,
  LOW_HANGING_FRUIT_KEYWORDS,
  AI_OVERVIEW_FEATURED_SNIPPETS,
  COMPETITOR_CONTENT_GAP_HUBS,
  CONTENT_REFRESH_AND_SINGLE_PUBLISH_RECORDS,
  CANNIBALIZATION_RESOLUTION_MATRIX,
  RECLAIMED_404_REDIRECTS_LIST,
  INTERNAL_LINK_OPPORTUNITIES_MATRIX,
  LINK_INTERSECT_AND_UNLINKED_MENTIONS,
  DESCRIPTIVE_ANCHOR_REPLACEMENTS,
  TECHNICAL_CRITICAL_AUDIT_CHECKS,
  getRouteAhrefsOptimizationBundle,
  resolveReclaimed404Redirect,
} from '@/services/ahrefsOpportunitiesService';
import { resolveRouteSeoPayload, injectServerSeoIntoHtml } from '@/server/seoPrerenderService';
import { handlePageSpeedInsightsRequest } from '@/server/pagespeedHandler';

describe('Ahrefs 12-Pillar SEO Opportunities & Server Prerender Verification', () => {
  it('registers all 12 Ahrefs SEO Opportunity pillars across Content (6), Links (5), and Technical (1)', () => {
    expect(AHREFS_12_OPPORTUNITY_PILLARS).toHaveLength(12);
    const contentPillars = AHREFS_12_OPPORTUNITY_PILLARS.filter((p) => p.category === 'Content');
    const linkPillars = AHREFS_12_OPPORTUNITY_PILLARS.filter((p) => p.category === 'Links');
    const techPillars = AHREFS_12_OPPORTUNITY_PILLARS.filter((p) => p.category === 'Technical');

    expect(contentPillars).toHaveLength(6);
    expect(linkPillars).toHaveLength(5);
    expect(techPillars).toHaveLength(1);

    expect(LOW_HANGING_FRUIT_KEYWORDS.length).toBeGreaterThanOrEqual(10);
    expect(AI_OVERVIEW_FEATURED_SNIPPETS.length).toBeGreaterThanOrEqual(6);
    expect(COMPETITOR_CONTENT_GAP_HUBS.length).toBeGreaterThanOrEqual(8);
    expect(CONTENT_REFRESH_AND_SINGLE_PUBLISH_RECORDS.length).toBeGreaterThanOrEqual(6);
    expect(CANNIBALIZATION_RESOLUTION_MATRIX.length).toBeGreaterThanOrEqual(7);
    expect(RECLAIMED_404_REDIRECTS_LIST.length).toBeGreaterThanOrEqual(8);
    expect(INTERNAL_LINK_OPPORTUNITIES_MATRIX.length).toBeGreaterThanOrEqual(8);
    expect(LINK_INTERSECT_AND_UNLINKED_MENTIONS.length).toBeGreaterThanOrEqual(4);
    expect(DESCRIPTIVE_ANCHOR_REPLACEMENTS.length).toBeGreaterThanOrEqual(5);
    expect(
      TECHNICAL_CRITICAL_AUDIT_CHECKS.every((c) => c.criticalErrorsCount === 0 && c.warningsCount === 0)
    ).toBe(true);
  });

  it('resolves route-specific AI Overview Answer Box, striking-distance keywords, and descriptive anchors', () => {
    const sampleRoutes = [
      '/',
      '/value-bets',
      '/btts',
      '/jackpot-predictions',
      '/cashout-calculator',
      '/code-converter',
      '/predict/arsenal-vs-chelsea',
      '/teams/arsenal',
    ];

    for (const route of sampleRoutes) {
      const bundle = getRouteAhrefsOptimizationBundle(route);
      expect(bundle.pathname).toBe(route);
      expect(bundle.aiOverviewQuestion.length).toBeGreaterThan(15);
      expect(bundle.aiOverviewAnswer.length).toBeGreaterThan(40);
      expect(bundle.aiOverviewBullets.length).toBeGreaterThanOrEqual(3);
      expect(bundle.strikingDistanceKeywords.length).toBeGreaterThanOrEqual(1);
      expect(bundle.lastModifiedIso).toBe('2026-10-30');
      expect(bundle.contextualInternalLinks.length).toBeGreaterThanOrEqual(4);
      expect(
        bundle.contextualInternalLinks.every(
          (lnk) =>
            lnk.descriptiveAnchor.length > 15 &&
            !['open', 'visit', 'click here', 'read more'].includes(lnk.descriptiveAnchor.toLowerCase())
        )
      ).toBe(true);
    }
  });

  it('enforces <=60 char <title> and <=155 char <meta description> in server-side prerender payloads', async () => {
    const routesToInspect = [
      '/',
      '/best-bets',
      '/value-bets',
      '/jackpot-predictions',
      '/code-converter',
      '/player-props-lab',
      '/predict/arsenal-vs-chelsea',
      '/teams/arsenal',
      '/players/erling-haaland',
    ];

    for (const route of routesToInspect) {
      const payload = await resolveRouteSeoPayload(route, 'https://predictpro.guru');
      expect(payload.title.length).toBeLessThanOrEqual(60);
      expect(payload.description.length).toBeLessThanOrEqual(155);
      expect(payload.canonicalUrl).toBe(`https://predictpro.guru${route}`);
      expect(payload.keywords.length).toBeGreaterThan(30);
      expect(payload.jsonLdSchemas.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('injects clamped <title>, <meta description>, <meta keywords>, and Speakable JSON-LD into raw HTML', async () => {
    const templateHtml = `<!DOCTYPE html><html><head><title>Placeholder</title><meta name="description" content="Old" /><meta name="keywords" content="Old" /><link rel="canonical" href="https://predictpro.guru/" /></head><body><div id="root"></div></body></html>`;
    const rendered = await injectServerSeoIntoHtml(templateHtml, '/value-bets', 'https://predictpro.guru');

    expect(rendered).toContain('<link rel="canonical" href="https://predictpro.guru/value-bets" />');
    expect(rendered).toContain('SpeakableSpecification');
    expect(rendered).toContain('2026-10-30');
    expect(rendered).toContain('daily value bets today (+ev)');
  });

  it('verifies Mobile PageSpeed Insights report #ksa4i5gm2f snapshot and deferred critical-path chunks', async () => {
    const psi = await handlePageSpeedInsightsRequest({
      url: 'https://predictpro.guru',
      strategy: 'mobile',
      force: true,
    });

    expect(psi.success).toBe(true);
    expect(psi.reportId).toBe('ksa4i5gm2f');
    expect(psi.reportUrl).toBe(
      'https://pagespeed.web.dev/analysis/https-predictpro-guru/ksa4i5gm2f?hl=en&form_factor=mobile'
    );
    expect(psi.mobile.scores.performance).toBeGreaterThanOrEqual(96);
    expect(psi.mobile.scores.seo).toBe(100);
    expect(psi.mobile.metrics.every((m) => m.status === 'good')).toBe(true);
    expect(
      psi.mobile.bundleBreakdown.some(
        (b) => b.chunk.includes('vendor-supabase') && b.loadPhase === 'Deferred Interaction'
      )
    ).toBe(true);
    expect(
      psi.mobile.bundleBreakdown.some(
        (b) => b.chunk.includes('vendor-seo') && b.loadPhase === 'Deferred Interaction'
      )
    ).toBe(true);
  });

  it('accurately resolves 301 reclaimed 404 URLs, parameter substitutions, and alias paths', () => {
    // Exact paths
    expect(resolveReclaimed404Redirect('/sportpesa-mega-jackpot-predictions')).toBe('/jackpot-predictions');
    expect(resolveReclaimed404Redirect('/corners-cards-predictions')).toBe('/corners-predictions');
    expect(resolveReclaimed404Redirect('/sportybet-code-converter')).toBe('/code-converter');
    expect(resolveReclaimed404Redirect('/epl')).toBe('/premier-league-predictions');
    expect(resolveReclaimed404Redirect('/both-teams-to-score')).toBe('/btts');

    // Dynamic :param pattern substitutions
    expect(resolveReclaimed404Redirect('/match/arsenal-vs-chelsea')).toBe('/predict/arsenal-vs-chelsea');
    expect(resolveReclaimed404Redirect('/matches/real-madrid-vs-barcelona')).toBe('/predict/real-madrid-vs-barcelona');
    expect(resolveReclaimed404Redirect('/team/arsenal')).toBe('/teams/arsenal');

    // Non-redirect path returns null
    expect(resolveReclaimed404Redirect('/unknown-custom-page')).toBeNull();
  });

  it('computes accurate high-level summary metrics and search filtering for Ahrefs opportunities', async () => {
    const { getAhrefsSummaryStats, searchAhrefsOpportunities } = await import('@/services/ahrefsOpportunitiesService');
    const stats = getAhrefsSummaryStats();

    expect(stats.totalPillars).toBe(12);
    expect(stats.contentPillarsCount).toBe(6);
    expect(stats.linkPillarsCount).toBe(5);
    expect(stats.technicalPillarsCount).toBe(1);
    expect(stats.totalReferringDomainsReclaimed).toBeGreaterThanOrEqual(200);
    expect(stats.siteHealthScore).toBe(100);
    expect(stats.criticalErrorsCount).toBe(0);

    const jackpotSearch = searchAhrefsOpportunities('jackpot');
    expect(jackpotSearch.keywords.some((k) => k.keyword.includes('jackpot'))).toBe(true);
    expect(jackpotSearch.redirects.some((r) => r.broken404Path.includes('jackpot'))).toBe(true);

    const emptySearch = searchAhrefsOpportunities('');
    expect(emptySearch.keywords.length).toBe(LOW_HANGING_FRUIT_KEYWORDS.length);
  });
});
