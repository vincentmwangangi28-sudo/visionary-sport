import { describe, it, expect } from 'vitest';
import {
  getBreadcrumbsForPath,
  generateBreadcrumbJsonLd,
  formatSlugToTitle,
} from '@/utils/breadcrumbHierarchy';

describe('breadcrumbHierarchy', () => {
  it('formats slugs into readable titles with acronym awareness', () => {
    expect(formatSlugToTitle('arsenal-vs-chelsea')).toBe('Arsenal vs Chelsea');
    expect(formatSlugToTitle('premier-league-prediction-guide-2026')).toBe(
      'Premier League Prediction Guide 2026'
    );
    expect(formatSlugToTitle('kpl-btts-xg-ai')).toBe('KPL BTTS xG AI');
  });

  it('generates the exact hierarchy requested: Home > Predictions > Premier League', () => {
    const crumbs = getBreadcrumbsForPath('/premier-league-predictions');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ name: 'Home', item: '/' });
    expect(crumbs[1]).toEqual({ name: 'Predictions', item: '/predict' });
    expect(crumbs[2]).toEqual({
      name: 'Premier League',
      item: '/premier-league-predictions',
      current: true,
    });
  });

  it('generates the correct hierarchy for other major leagues and markets', () => {
    const uclCrumbs = getBreadcrumbsForPath('/champions-league-predictions');
    expect(uclCrumbs.map(c => c.name)).toEqual(['Home', 'Predictions', 'Champions League']);

    const laligaCrumbs = getBreadcrumbsForPath('/la-liga-predictions');
    expect(laligaCrumbs.map(c => c.name)).toEqual(['Home', 'Predictions', 'La Liga']);

    const valueCrumbs = getBreadcrumbsForPath('/value-bets');
    expect(valueCrumbs.map(c => c.name)).toEqual(['Home', 'Predictions', 'Value Bets']);

    const jackpotCrumbs = getBreadcrumbsForPath('/jackpot-predictions');
    expect(jackpotCrumbs.map(c => c.name)).toEqual(['Home', 'Predictions', 'Mega Jackpot']);
  });

  it('generates hierarchy for match predictions under /predict/:matchSlug', () => {
    const crumbs = getBreadcrumbsForPath('/predict/arsenal-vs-chelsea', {
      customTitle: 'Arsenal vs Chelsea',
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].name).toBe('Home');
    expect(crumbs[1]).toEqual({ name: 'Predictions', item: '/predict' });
    expect(crumbs[2]).toEqual({
      name: 'Arsenal vs Chelsea',
      item: '/predict/arsenal-vs-chelsea',
      current: true,
    });
  });

  it('generates blog article hierarchy with category intermediate crumb', () => {
    const crumbs = getBreadcrumbsForPath('/blog/value-betting-explained');
    expect(crumbs.map(c => c.name)).toEqual([
      'Home',
      'Blog',
      'Strategy',
      'Value Betting in Football: A Complete Guide',
    ]);
  });

  it('generates valid Schema.org BreadcrumbList JSON-LD markup', () => {
    const crumbs = getBreadcrumbsForPath('/premier-league-predictions');
    const jsonLd = generateBreadcrumbJsonLd(crumbs, 'https://predictpro.guru');

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(3);

    expect(jsonLd.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://predictpro.guru/',
    });

    expect(jsonLd.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Predictions',
      item: 'https://predictpro.guru/predict',
    });

    expect(jsonLd.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Premier League',
      item: 'https://predictpro.guru/premier-league-predictions',
    });
  });

  it('handles root home route properly', () => {
    const homeCrumbs = getBreadcrumbsForPath('/');
    expect(homeCrumbs).toHaveLength(1);
    expect(homeCrumbs[0]).toEqual({ name: 'Home', item: '/', current: true });
  });
});
