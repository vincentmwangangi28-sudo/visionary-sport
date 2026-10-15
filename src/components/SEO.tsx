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
  const resolved = useSEOManager(props);

  return (
    <Helmet prioritizeSeoTags>
      <title>{resolved.fullTitle}</title>
      <meta name="description" content={resolved.description} />
      <link rel="canonical" href={resolved.canonicalUrl} />
      <meta property="og:title" content={resolved.fullTitle} />
      <meta property="og:description" content={resolved.description} />
      <meta property="og:url" content={resolved.canonicalUrl} />
      <meta property="og:type" content={resolved.type} />
      <meta property="og:image" content={resolved.image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolved.fullTitle} />
      <meta name="twitter:description" content={resolved.description} />
      <meta name="twitter:image" content={resolved.image} />
      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(resolved.structuredData)}
      </script>
    </Helmet>
  );
};
