import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'sports.event';
  keywords?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const BASE_URL = 'https://predictpro.guru';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'PredictPro — AI Football Predictions';

export const SEO = ({
  title = 'PredictPro — AI Football Predictions | Best Bets Today',
  description = 'Get AI-powered football predictions with 87% accuracy. Free daily tips for Premier League, La Liga, Champions League, KPL and 40+ leagues worldwide. Confidence scores, odds, H2H stats.',
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = 'football predictions today, AI football tips, best football bets, soccer predictions, Premier League predictions, Champions League tips, KPL predictions, football betting tips, correct score predictions, BTTS predictions',
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title.includes('PredictPro') ? title : `${title} | PredictPro`;
  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== 'undefined'
      ? `${BASE_URL}${window.location.pathname}`
      : BASE_URL;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: SITE_NAME,
        description,
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
      ...(structuredData ? [structuredData] : []),
    ],
  };

  return (
    <Helmet>
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
