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
  const { structuredData } = useSEOManager(props);

  return (
    <Helmet prioritizeSeoTags>
      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
