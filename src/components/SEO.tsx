import {
  useSEOManager,
  SEOBreadcrumbItem,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';

export type BreadcrumbItem = SEOBreadcrumbItem;
export type SEOProps = SEOManagerOptions;

export const SEO = (props: SEOProps) => {
  // Synchronize document.head directly via useSEOManager to guarantee a single
  // deduplicated <link rel="canonical">, hreflang set, and @graph JSON-LD block
  // without React Helmet appending duplicate tags alongside static prerendered HTML.
  useSEOManager(props);
  return null;
};

