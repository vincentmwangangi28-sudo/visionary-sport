import { Helmet } from 'react-helmet-async';
interface SEOProps {
  title?: string; description?: string; image?: string; url?: string; type?: 'website' | 'article';
}
const SITE_NAME = 'Visionary Sport';
const BASE_URL = 'https://visionarysport.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESC = 'AI-powered football predictions for the top European leagues. High-confidence tips, live scores, and exclusive insights.';
export const SEO = ({ title, description = DEFAULT_DESC, image = DEFAULT_IMAGE, url, type = 'website' }: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
