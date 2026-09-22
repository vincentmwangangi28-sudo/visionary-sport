import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  name: string;
  item: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'sports.event';
  keywords?: string;
  noIndex?: boolean;
  structuredData?: object;
  breadcrumbs?: BreadcrumbItem[];
}

const BASE_URL = 'https://predictpro.guru';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'PredictPro — AI Football Predictions';

/**
 * Normalizes description for WebPage schema so search engines receive a snippet strictly
 * between 150 and 160 characters in length.
 */
function normalizeWebPageDescription(raw: string): string {
  let text = (raw || '').trim();

  // If longer than 160 characters, truncate cleanly on a word boundary
  if (text.length > 160) {
    let truncated = text.slice(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 135) {
      truncated = truncated.slice(0, lastSpace);
    }
    text = `${truncated}...`;
  }

  // If shorter than 150 characters, extend with high-intent keywords to fit exactly 150-160
  if (text.length < 150) {
    const cleanBase = text.replace(/[.\s]+$/, '');
    const sentences = [
      ' Get verified AI football tips, Poisson probability models & +EV daily value picks.',
      ' Access real-time AI football predictions, head-to-head match stats & betting advice.',
      ' Explore live football match odds, expected goals (xG), and AI betting recommendations.',
      ' Discover daily banker bets, expected goals (xG), Poisson stats & match predictions.',
    ];

    let matched = false;
    for (const sent of sentences) {
      const candidate = `${cleanBase}.${sent}`;
      if (candidate.length >= 150 && candidate.length <= 160) {
        text = candidate;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const pool = ' Get real-time AI football betting tips, banker picks, xG stats, Poisson goal models & verified predictions.';
      const targetLen = 155;
      const needed = targetLen - cleanBase.length - 1;
      if (needed > 20 && needed <= pool.length) {
        text = `${cleanBase}.${pool.slice(0, needed - 1)}.`;
      } else {
        text = `${cleanBase}.${pool}`.slice(0, 157) + '...';
      }
    }
  }

  // Hard safety clamp to strictly enforce [150, 160]
  if (text.length < 150) {
    text = text.padEnd(152, '.');
  } else if (text.length > 160) {
    text = text.slice(0, 157) + '...';
  }

  return text;
}

/**
 * Builds breadcrumbs automatically if not explicitly supplied
 */
function deriveBreadcrumbs(canonicalPath: string, pageTitle: string): BreadcrumbItem[] {
  const clean = canonicalPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) {
    return [{ name: 'Home', item: '/' }];
  }

  const parts = clean.split('/');
  const list: BreadcrumbItem[] = [{ name: 'Home', item: '/' }];
  let acc = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    acc += `/${part}`;

    if (i === parts.length - 1 && pageTitle) {
      // Use clean page title for terminal crumb
      const cleanName = pageTitle.replace(/\s*\|\s*PredictPro.*$/i, '').trim();
      list.push({ name: cleanName.length <= 40 ? cleanName : `${cleanName.slice(0, 37)}...`, item: acc });
    } else {
      const readable = part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/Btts/i, 'BTTS')
        .replace(/H2h/i, 'H2H')
        .replace(/Epl/i, 'EPL')
        .replace(/Kpl/i, 'KPL')
        .replace(/Seo/i, 'SEO')
        .replace(/Ai/i, 'AI')
        .replace(/Us /i, 'US ');
      list.push({ name: readable, item: acc });
    }
  }

  return list;
}

export const SEO = ({
  title = 'AI Football Predictions Today | Free Betting Tips',
  description = 'Get accurate AI football predictions and daily betting tips today. Verified banker bets, xG stats, and value picks across 40+ leagues worldwide.',
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = 'football predictions today, AI football tips, best football bets, soccer predictions, Premier League predictions, Champions League tips, KPL predictions, football betting tips, correct score predictions, BTTS predictions',
  noIndex = false,
  structuredData,
  breadcrumbs,
}: SEOProps) => {
  const fullTitle = title.includes('PredictPro')
    ? title
    : title.length + 13 <= 65
      ? `${title} | PredictPro`
      : title;
  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== 'undefined'
      ? `${BASE_URL}${window.location.pathname}`
      : BASE_URL;

  const currentPath = canonical || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const activeBreadcrumbs = breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs
    : deriveBreadcrumbs(currentPath, fullTitle);

  const breadcrumbListSchema = {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: activeBreadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item.startsWith('http') ? crumb.item : `${BASE_URL}${crumb.item}`,
    })),
  };

  // Ensure WebPage description is strictly 150-160 characters for search engines
  const webPageDescription = normalizeWebPageDescription(description);

  const webPageSchema = {
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: fullTitle,
    description: webPageDescription,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    },
    breadcrumb: {
      '@id': `${canonicalUrl}#breadcrumb`,
    },
    inLanguage: 'en',
    potentialAction: {
      '@type': 'ReadAction',
      target: [canonicalUrl],
    },
  };

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: SITE_NAME,
        description: 'AI-powered football predictions today with 87% accuracy. Free daily betting tips, banker picks, and value bets for 40+ global leagues.',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/predict?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'PredictPro',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
        sameAs: ['https://twitter.com/PredictProAI'],
        contactPoint: { '@type': 'ContactPoint', email: 'support@predictpro.guru', contactType: 'customer support' },
      },
      {
        '@type': 'SportsOrganization',
        name: 'PredictPro',
        sport: 'Football',
        url: BASE_URL,
        description: 'AI-powered football predictions platform covering 40+ leagues worldwide',
      },
      webPageSchema,
      breadcrumbListSchema,
      ...(structuredData ? [structuredData] : []),
    ],
  };

  return (
    <Helmet prioritizeSeoTags>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {!noIndex && <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@PredictProAI" />
      <meta name="twitter:creator" content="@PredictProAI" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Technical */}
      <meta name="theme-color" content="#6d28d9" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="PredictPro" />

      {/* Geo targeting */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Nairobi, Kenya" />
      <meta name="ICBM" content="-1.286389, 36.817223" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en" />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(defaultStructuredData)}
      </script>
    </Helmet>
  );
};
