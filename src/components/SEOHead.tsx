import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: object;
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
  };
  faqs?: Array<{ question: string; answer: string }>;
}

export const SEOHead = ({
  title = "PredictPro - AI Sports Predictions",
  description = "Get AI-powered sports predictions with high accuracy. Football, basketball, tennis predictions with confidence scores and expert analysis.",
  keywords = ["sports predictions", "AI predictions", "football betting tips", "match predictions"],
  ogImage = "https://predictpro.guru/og-image.jpg",
  ogType = "website",
  canonicalUrl,
  structuredData,
  article,
  match,
  faqs
}: SEOHeadProps) => {
  const fullTitle = title.includes("PredictPro") ? title : `${title} | PredictPro`;
  const url = canonicalUrl || "https://predictpro.guru";

  // Build structured data
  const buildStructuredData = () => {
    const schemas: object[] = [];

    // Website schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "PredictPro",
      "url": "https://predictpro.guru",
      "description": description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://predictpro.guru/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    });

    // Organization schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PredictPro",
      "url": "https://predictpro.guru",
      "logo": "https://predictpro.guru/logo.png",
      "sameAs": [
        "https://twitter.com/predictproguru",
        "https://facebook.com/predictproguru"
      ]
    });

    // Article schema
    if (article) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": ogImage,
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
        "dateModified": article.modifiedTime,
        "articleSection": article.section,
        "keywords": article.tags?.join(", ")
      });
    }

    // Sports Event schema
    if (match) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${match.homeTeam} vs ${match.awayTeam}`,
        "description": `AI prediction for ${match.homeTeam} vs ${match.awayTeam}: ${match.prediction}`,
        "startDate": match.date,
        "location": {
          "@type": "Place",
          "name": match.league
        },
        "homeTeam": {
          "@type": "SportsTeam",
          "name": match.homeTeam
        },
        "awayTeam": {
          "@type": "SportsTeam",
          "name": match.awayTeam
        }
      });
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
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="author" content="PredictPro" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="PredictPro" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@predictproguru" />

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
