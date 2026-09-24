import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getBreadcrumbsForPath,
  generateBreadcrumbJsonLd,
} from '@/utils/breadcrumbHierarchy';

interface BreadcrumbLayoutSchemaProps {
  baseUrl?: string;
}

/**
 * Global layout component that injects Google-compliant Schema.org BreadcrumbList
 * JSON-LD structured data into the document head based on the active router location.
 */
export const BreadcrumbLayoutSchema: React.FC<BreadcrumbLayoutSchemaProps> = ({
  baseUrl = 'https://predictpro.guru',
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // On root homepage, the primary entity is WebSite, so breadcrumbs list is not needed
  if (currentPath === '/' || currentPath === '') {
    return null;
  }

  const crumbs = getBreadcrumbsForPath(currentPath);
  if (!crumbs || crumbs.length <= 1) {
    return null;
  }

  const jsonLd = generateBreadcrumbJsonLd(crumbs, baseUrl);

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbLayoutSchema;
