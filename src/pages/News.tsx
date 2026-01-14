import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { TransferRumorsFeed } from '@/components/TransferRumorsFeed';
import { InteractivePolls } from '@/components/InteractivePolls';
import { Newspaper, TrendingUp, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function News() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { articles, loading } = useNewsArticles(activeCategory);

  const categories = [
    { id: undefined, label: 'All' },
    { id: 'preview', label: 'Match Previews' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'transfer', label: 'Transfers' },
    { id: 'trending', label: 'Trending' },
  ];

  const newsStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sports News & Analysis | PredictPro Guru",
    "description": "Latest football news, match previews, post-match analysis, and transfer rumors from PredictPro Guru's AI-powered sports platform.",
    "url": "https://www.predictpro.guru/news",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Sports News Articles",
      "itemListElement": articles.slice(0, 10).map((article, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "NewsArticle",
          "headline": article.title,
          "description": article.excerpt,
          "author": {
            "@type": "Organization",
            "name": "PredictPro Guru"
          },
          "datePublished": article.created_at,
          "publisher": {
            "@type": "Organization",
            "name": "PredictPro Guru",
            "url": "https://www.predictpro.guru"
          }
        }
      }))
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Helmet>
        <title>Football News & Betting Tips Kenya | PredictPro</title>
        <meta name="description" content="Latest football news, match previews, expert analysis, and transfer rumors. AI-powered sports insights from Kenya's #1 prediction platform. Daily betting tips." />
        <meta property="og:title" content="Football News & Betting Tips Kenya | PredictPro" />
        <meta property="og:description" content="Get the latest football news, match previews, and transfer updates. Free betting tips for Kenya sports fans." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://predictpro.guru/og-news.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="football news Kenya, betting tips Nairobi, Premier League news, transfer rumors, match previews Kenya" />
        <link rel="canonical" href="https://predictpro.guru/news" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsStructuredData) }} />

      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Sports News Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest football news, expert analysis, and transfer rumors
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main News Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Latest Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Category Tabs */}
                <Tabs defaultValue="all" className="mb-6">
                  <TabsList className="grid grid-cols-5 w-full">
                    {categories.map(cat => (
                      <TabsTrigger
                        key={cat.id || 'all'}
                        value={cat.id || 'all'}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-muted rounded-lg" />
                    ))}
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-12">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No articles in this category yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map(article => (
                      <article
                        key={article.id}
                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {article.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(article.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>

                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>

                            {article.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.excerpt}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {article.author}
                              </span>
                              <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                Read more <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {article.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-muted px-2 py-0.5 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <InteractivePolls />
            <TransferRumorsFeed />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
