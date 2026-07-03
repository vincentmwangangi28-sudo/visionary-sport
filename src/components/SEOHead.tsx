import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: object;
  noIndex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  match?: {
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    date?: string;
    prediction?: string;
    confidence?: number;
  };
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  video?: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    contentUrl?: string;
  };
}

// Kenya-focused keywords for SEO
const KENYA_KEYWORDS = [
  "Kenya football predictions",
  "Kenya betting tips",
  "AI sports predictions Kenya",
  "football analysis Kenya",
  "Premier League predictions Kenya",
  "betting tips Nairobi",
  "sports betting Kenya",
];

export const SEOHead = ({
  title = "PredictPro - AI Sports Predictions Kenya",
  description = "AI football predictions Kenya with 85%+ accuracy. Daily betting tips, match analysis & smart accumulators for top European leagues.",
  keywords = ["sports predictions", "AI predictions", "football betting tips Kenya", "match predictions", "Premier League tips"],
  ogImage = "https://predictpro.guru/og-image.png",
  ogType = "website",
  canonicalUrl,
  structuredData,
  noIndex = false,
  article,
  match,
  faqs,
  breadcrumbs,
  video
}: SEOHeadProps) => {
  // Ensure title includes brand and is under 60 chars
  const fullTitle = title.includes("PredictPro") 
    ? title.length > 60 ? title.substring(0, 57) + "..." : title
    : `${title} | PredictPro`.substring(0, 60);
  
  // Ensure description is under 160 chars
  const metaDescription = description.length > 160 
    ? description.substring(0, 157) + "..."
    : description;
  
  // Merge keywords with Kenya-focused ones
  const allKeywords = [...new Set([...keywords, ...KENYA_KEYWORDS])];
  
  const url = canonicalUrl || "https://predictpro.guru";

  // Build structured data
  const buildStructuredData = () => {
    const schemas: object[] = [];

    // Website schema with search action
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "PredictPro",
      "alternateName": "PredictPro Guru Kenya",
      "url": "https://predictpro.guru",
      "description": "AI-powered sports predictions platform in Kenya with 85%+ accuracy",
      "inLanguage": ["en", "sw"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://predictpro.guru/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    });

    // Organization schema with enhanced info
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PredictPro",
      "url": "https://predictpro.guru",
      "logo": {
        "@type": "ImageObject",
        "url": "https://predictpro.guru/logo.png",
        "width": "180",
        "height": "60"
      },
      "sameAs": [
        "https://twitter.com/predictproguru",
        "https://facebook.com/predictproguru",
        "https://instagram.com/predictproguru"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@predictpro.guru",
        "areaServed": "KE",
        "availableLanguage": ["English", "Swahili"]
      },
      "areaServed": {
        "@type": "Country",
        "name": "Kenya"
      }
    });

    // Breadcrumb schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": crumb.name,
          "item": crumb.url
        }))
      });
    }

    // Article schema
    if (article) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": fullTitle,
        "description": metaDescription,
        "image": {
          "@type": "ImageObject",
          "url": ogImage,
          "width": "1200",
          "height": "630"
        },
        "author": {
          "@type": "Organization",
          "name": article.author || "PredictPro AI"
        },
        "publisher": {
          "@type": "Organization",
          "name": "PredictPro",
          "logo": {
            "@type": "ImageObject",
            "url": "https://predictpro.guru/logo.png"
          }
        },
        "datePublished": article.publishedTime,
        "dateModified": article.modifiedTime || article.publishedTime,
        "articleSection": article.section,
        "keywords": article.tags?.join(", "),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        }
      });
    }

    // Sports Event schema with enhanced data
    if (match) {
      const startDate = match.date || new Date().toISOString();
      const endDate = new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
      
      const sportsEvent: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${match.homeTeam} vs ${match.awayTeam}`,
        "description": `AI prediction for ${match.homeTeam} vs ${match.awayTeam}: ${match.prediction}${match.confidence ? ` (${match.confidence}% confidence)` : ''}`,
        "startDate": startDate,
        "endDate": endDate,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": `${match.league} Venue`,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "GB"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": match.league,
          "url": "https://predictpro.guru"
        },
        "homeTeam": {
          "@type": "SportsTeam",
          "name": match.homeTeam
        },
        "awayTeam": {
          "@type": "SportsTeam",
          "name": match.awayTeam
        },
        "image": "https://predictpro.guru/og-image.png",
        "offers": {
          "@type": "Offer",
          "url": url,
          "price": "0",
          "priceCurrency": "KES",
          "availability": "https://schema.org/InStock"
        }
      };

      if (match.prediction) {
        sportsEvent["additionalProperty"] = [
          { "@type": "PropertyValue", "name": "Recommended Outcome", "value": match.prediction },
          ...(match.confidence ? [{ "@type": "PropertyValue", "name": "Confidence Score", "value": `${match.confidence}%` }] : [])
        ];
      }

      schemas.push(sportsEvent);
    }

    // FAQ schema
    if (faqs && faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }

    // Video schema
    if (video) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.name,
        "description": video.description,
        "thumbnailUrl": video.thumbnailUrl,
        "uploadDate": video.uploadDate,
        "duration": video.duration,
        "contentUrl": video.contentUrl,
        "publisher": {
          "@type": "Organization",
          "name": "PredictPro",
          "logo": {
            "@type": "ImageObject",
            "url": "https://predictpro.guru/logo.png"
          }
        }
      });
    }

    // Custom structured data
    if (structuredData) {
      schemas.push(structuredData);
    }

    return schemas;
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      <meta name="author" content="PredictPro" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noIndex ? "noindex" : "index, follow"} />
      <link rel="canonical" href={url} />

      {/* Hreflang Tags */}
      <link rel="alternate" hrefLang="en-KE" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="sw" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* RSS Feeds */}
      <link rel="alternate" type="application/rss+xml" title="PredictPro News" href={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'osyygprivxbknsngclhr'}.supabase.co/functions/v1/generate-rss-feed?type=news`} />
      <link rel="alternate" type="application/rss+xml" title="PredictPro Predictions" href={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'osyygprivxbknsngclhr'}.supabase.co/functions/v1/generate-rss-feed?type=predictions`} />

      {/* Language & Region */}
      <meta httpEquiv="content-language" content="en-KE" />
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kenya" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PredictPro" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@predictproguru" />
      <meta name="twitter:creator" content="@predictproguru" />

      {/* Article specific */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {article?.tags?.map((tag, idx) => (
        <meta key={idx} property="article:tag" content={tag} />
      ))}

      {/* Structured Data */}
      {buildStructuredData().map((schema, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
