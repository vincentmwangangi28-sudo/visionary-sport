import { Helmet } from 'react-helmet-async';
import {
  useSEOManager,
  SEOBreadcrumbItem,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';

export type BreadcrumbItem = SEOBreadcrumbItem;
export type SEOProps = SEOManagerOptions;

const SITE_NAME = 'PredictPro — AI Football Predictions';

export const SEO = (props: SEOProps) => {
  const {
    fullTitle,
    description,
    canonicalUrl,
    image,
    type,
    keywords,
    noIndex,
    structuredData,
  } = useSEOManager(props);

  return (
    <Helmet prioritizeSeoTags>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {!noIndex && (
        <meta
          name="robots"
          content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
        />
      )}

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
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
