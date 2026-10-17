import React from 'react';

interface BreadcrumbLayoutSchemaProps {
  baseUrl?: string;
}

/**
 * Global layout component. BreadcrumbList JSON-LD structured data is now
 * consolidated inside useSEOManager's single @graph JSON-LD block in <head>
 * to avoid duplicate JSON-LD script blocks.
 */
export const BreadcrumbLayoutSchema: React.FC<BreadcrumbLayoutSchemaProps> = () => {
  return null;
};

export default BreadcrumbLayoutSchema;

