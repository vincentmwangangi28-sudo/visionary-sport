import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolveUserLocale,
  buildHreflangUrl,
  normalizeSEODescription,
  generateFallbackLocalizedDescription,
  LOCALIZED_ROUTE_METADATA,
  GLOBAL_HREFLANGS,
  pruneAlternateHreflangTags,
} from '@/hooks/useSEOManager';

describe('useSEOManager - International SEO & Locale Detection', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveUserLocale', () => {
    it('detects language from URL query parameters (e.g. ?lang=es)', () => {
      // Mock window.location.search
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '?lang=es',
        },
        writable: true,
      });

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('es');
      expect(profile.isNonEnglish).toBe(true);
      expect(profile.source).toBe('query_param');
      expect(profile.isRTL).toBe(false);
      expect(profile.ogLocale).toBe('es_ES');
    });

    it('detects regional Spanish locale (?lang=es-MX)', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '?lang=es-MX',
        },
        writable: true,
      });

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('es');
      expect(profile.locale).toBe('es-MX');
      expect(profile.ogLocale).toBe('es_MX');
      expect(profile.isNonEnglish).toBe(true);
    });

    it('detects Swahili (?lang=sw-KE) with correct og:locale and LTR', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '?lang=sw-KE',
        },
        writable: true,
      });

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('sw');
      expect(profile.ogLocale).toBe('sw_KE');
      expect(profile.isRTL).toBe(false);
    });

    it('detects Arabic (?lang=ar-EG) with RTL flag enabled', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '?lang=ar-EG',
        },
        writable: true,
      });

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('ar');
      expect(profile.isRTL).toBe(true);
      expect(profile.ogLocale).toBe('ar_EG');
    });

    it('detects Portuguese (?lang=pt-BR)', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '?lang=pt-BR',
        },
        writable: true,
      });

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('pt');
      expect(profile.ogLocale).toBe('pt_BR');
    });

    it('detects user preference from localStorage when no query param is present', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          search: '',
        },
        writable: true,
      });

      localStorage.setItem(
        'predictpro_user_preferences_v2',
        JSON.stringify({ language: 'fr' })
      );

      const profile = resolveUserLocale();
      expect(profile.lang).toBe('fr');
      expect(profile.source).toBe('preferences');
      expect(profile.ogLocale).toBe('fr_FR');
      expect(profile.isNonEnglish).toBe(true);
    });
  });

  describe('buildHreflangUrl', () => {
    const canonical = 'https://predictpro.guru/best-bets';

    it('returns canonical URL unchanged for x-default and en', () => {
      expect(buildHreflangUrl(canonical, 'x-default')).toBe(canonical);
      expect(buildHreflangUrl(canonical, 'en')).toBe(canonical);
    });

    it('appends ?lang={code} for language variants', () => {
      expect(buildHreflangUrl(canonical, 'es')).toBe('https://predictpro.guru/best-bets?lang=es');
      expect(buildHreflangUrl(canonical, 'sw')).toBe('https://predictpro.guru/best-bets?lang=sw');
      expect(buildHreflangUrl(canonical, 'fr')).toBe('https://predictpro.guru/best-bets?lang=fr');
      expect(buildHreflangUrl(canonical, 'pt')).toBe('https://predictpro.guru/best-bets?lang=pt');
      expect(buildHreflangUrl(canonical, 'ar')).toBe('https://predictpro.guru/best-bets?lang=ar');
      expect(buildHreflangUrl(canonical, 'de')).toBe('https://predictpro.guru/best-bets?lang=de');
    });

    it('handles regional variants properly (e.g. sw-KE, es-MX, pt-BR)', () => {
      expect(buildHreflangUrl(canonical, 'sw-KE')).toBe('https://predictpro.guru/best-bets?lang=sw-KE');
      expect(buildHreflangUrl(canonical, 'es-MX')).toBe('https://predictpro.guru/best-bets?lang=es-MX');
      expect(buildHreflangUrl(canonical, 'pt-BR')).toBe('https://predictpro.guru/best-bets?lang=pt-BR');
    });

    it('preserves existing search parameters when appending lang', () => {
      const urlWithQuery = 'https://predictpro.guru/predict?match=123';
      const result = buildHreflangUrl(urlWithQuery, 'es');
      expect(result).toBe('https://predictpro.guru/predict?match=123&lang=es');
    });
  });

  describe('normalizeSEODescription', () => {
    it('appends localized suffix for Spanish when description is short', () => {
      const shortDesc = 'Predicciones de fútbol de hoy';
      const normalized = normalizeSEODescription(shortDesc, 'es');
      expect(normalized).toContain('Predicciones de fútbol con IA');
      expect(normalized.length).toBeGreaterThanOrEqual(70);
      expect(normalized.length).toBeLessThanOrEqual(155);
    });

    it('appends localized suffix for Swahili when description is short', () => {
      const shortDesc = 'Utabiri wa soka leo';
      const normalized = normalizeSEODescription(shortDesc, 'sw');
      expect(normalized).toContain('Utabiri wa kila siku wa mpira');
      expect(normalized.length).toBeLessThanOrEqual(155);
    });

    it('appends localized suffix for French when description is short', () => {
      const shortDesc = 'Pronostics football du jour';
      const normalized = normalizeSEODescription(shortDesc, 'fr');
      expect(normalized).toContain('Pronostics foot quotidiens IA');
      expect(normalized.length).toBeLessThanOrEqual(155);
    });

    it('strictly clamps long descriptions to <= 155 characters', () => {
      const longText =
        'Este es un texto extremadamente largo y detallado que busca describir todas las funciones avanzadas de la plataforma de inteligencia artificial de fútbol predictpro para ganar apuestas deportivas';
      const normalized = normalizeSEODescription(longText, 'es');
      expect(normalized.length).toBeLessThanOrEqual(155);
      expect(normalized.endsWith('...')).toBe(true);
    });
  });

  describe('generateFallbackLocalizedDescription', () => {
    it('generates high quality Spanish description within character limits', () => {
      const desc = generateFallbackLocalizedDescription(
        '/custom-match',
        'es',
        'English fallback description',
        'Arsenal vs Chelsea'
      );
      expect(desc).toContain('Pronósticos de fútbol con IA');
      expect(desc.length).toBeGreaterThanOrEqual(90);
      expect(desc.length).toBeLessThanOrEqual(155);
    });

    it('generates high quality Swahili description within character limits', () => {
      const desc = generateFallbackLocalizedDescription(
        '/custom-match',
        'sw',
        'English fallback description',
        'Gor Mahia vs AFC Leopards'
      );
      expect(desc).toContain('Utabiri wa mechi za mpira');
      expect(desc.length).toBeGreaterThanOrEqual(90);
      expect(desc.length).toBeLessThanOrEqual(155);
    });

    it('generates high quality Arabic description', () => {
      const desc = generateFallbackLocalizedDescription(
        '/custom-match',
        'ar',
        'English fallback description',
        'Al Ahly vs Zamalek'
      );
      expect(desc).toContain('توقعات مباريات كرة القدم بالذكاء الاصطناعي');
      expect(desc.length).toBeLessThanOrEqual(155);
    });
  });

  describe('LOCALIZED_ROUTE_METADATA coverage', () => {
    it('contains comprehensive localized metadata across major routes', () => {
      const routesToCheck = [
        '/',
        '/best-bets',
        '/value-bets',
        '/btts',
        '/correct-score',
        '/accumulator',
        '/streaks',
        '/dropping-odds',
        '/screener',
        '/track-record',
        '/premier-league-predictions',
        '/champions-league-predictions',
        '/la-liga-predictions',
        '/kpl-predictions',
        '/jackpot-predictions',
      ];

      for (const route of routesToCheck) {
        const routeData = LOCALIZED_ROUTE_METADATA[route];
        expect(routeData, `Missing route data for ${route}`).toBeDefined();
        expect(routeData?.es?.description).toBeDefined();
        expect(routeData?.sw?.description).toBeDefined();
        expect(routeData?.fr?.description).toBeDefined();
        expect(routeData?.pt?.description).toBeDefined();
        expect(routeData?.ar?.description).toBeDefined();
        expect(routeData?.de?.description).toBeDefined();
      }
    });
  });

  describe('GLOBAL_HREFLANGS', () => {
    it('contains x-default, primary languages, and high-value regional targets', () => {
      expect(GLOBAL_HREFLANGS).toContain('x-default');
      expect(GLOBAL_HREFLANGS).toContain('en');
      expect(GLOBAL_HREFLANGS).toContain('sw');
      expect(GLOBAL_HREFLANGS).toContain('sw-KE');
      expect(GLOBAL_HREFLANGS).toContain('sw-TZ');
      expect(GLOBAL_HREFLANGS).toContain('es');
      expect(GLOBAL_HREFLANGS).toContain('es-ES');
      expect(GLOBAL_HREFLANGS).toContain('es-MX');
      expect(GLOBAL_HREFLANGS).toContain('fr');
      expect(GLOBAL_HREFLANGS).toContain('fr-FR');
      expect(GLOBAL_HREFLANGS).toContain('pt');
      expect(GLOBAL_HREFLANGS).toContain('pt-BR');
      expect(GLOBAL_HREFLANGS).toContain('ar');
      expect(GLOBAL_HREFLANGS).toContain('ar-EG');
      expect(GLOBAL_HREFLANGS).toContain('de');
      expect(GLOBAL_HREFLANGS).toContain('de-DE');
    });
  });

  describe('pruneAlternateHreflangTags', () => {
    it('removes stale alternate links that are not in the valid set', () => {
      const validLink = document.createElement('link');
      validLink.setAttribute('rel', 'alternate');
      validLink.setAttribute('hreflang', 'es');
      validLink.setAttribute('href', 'https://predictpro.guru/?lang=es');
      document.head.appendChild(validLink);

      const staleLink = document.createElement('link');
      staleLink.setAttribute('rel', 'alternate');
      staleLink.setAttribute('hreflang', 'xx-INVALID');
      staleLink.setAttribute('href', 'https://predictpro.guru/?lang=xx-INVALID');
      document.head.appendChild(staleLink);

      expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(2);

      pruneAlternateHreflangTags(new Set(['es']));

      const remaining = document.head.querySelectorAll('link[rel="alternate"]');
      expect(remaining.length).toBe(1);
      expect(remaining[0].getAttribute('hreflang')).toBe('es');
    });
  });
});
