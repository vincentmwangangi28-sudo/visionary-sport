import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { TransferRumorsFeed } from '@/components/TransferRumorsFeed';
import { InteractivePolls } from '@/components/InteractivePolls';
import { FeaturedNewsHero } from '@/components/FeaturedNewsHero';
import { NewsMatchCard } from '@/components/NewsMatchCard';
import { NewsArticleModal } from '@/components/NewsArticleModal';
import { TeamLogo } from '@/components/TeamLogo';
import { Newspaper, TrendingUp, Sparkles, RefreshCw, Zap, Calendar, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  featured_image: string | null;
  author: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function News() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { articles, loading, refetch } = useNewsArticles(activeCategory);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { id: undefined, label: 'All', icon: Newspaper },
    { id: 'Match Preview', label: 'Match Previews', icon: Calendar },
    { id: 'League Roundup', label: 'Roundups', icon: Trophy },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'trending', label: 'Trending', icon: Zap },
  ];

  // Get featured article (first one with most views or most recent)
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  const handleGenerateNews = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-all-games-news');
      
      if (error) throw error;
      
      toast.success(`Generated ${data.articlesGenerated} new articles!`);
      refetch();
    } catch (error) {
      console.error('Error generating news:', error);
      toast.error('Failed to generate news. Try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Sports News</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Sports News Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Real-time match previews, AI analysis, and transfer news - updated automatically every day
          </p>
          
          <Button 
            variant="outline" 
            onClick={handleGenerateNews}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Latest News'}
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat.id || 'all'}
                  value={cat.id || 'all'}
                  onClick={() => setActiveCategory(cat.id)}
                  className="gap-1"
                >
                  <cat.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">
                Click the button above to generate AI-powered news for today's matches
              </p>
              <Button onClick={handleGenerateNews} disabled={isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate News Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Featured Article */}
            {featuredArticle && (
              <FeaturedNewsHero 
                article={featuredArticle} 
                onClick={() => setSelectedArticle(featuredArticle)}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main News Grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Latest Articles
                  </h2>
                  <Badge variant="outline">
                    {articles.length} articles
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {remainingArticles.map(article => (
                    <NewsMatchCard 
                      key={article.id} 
                      article={article}
                      onClick={() => setSelectedArticle(article)}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Top Teams Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Popular Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'Arsenal', 'Liverpool', 'Manchester City', 
                      'Real Madrid', 'Barcelona', 'Bayern Munich'
                    ].map(team => (
                      <div key={team} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <TeamLogo teamName={team} size="sm" />
                        <span className="text-sm font-medium">{team}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <InteractivePolls />
                <TransferRumorsFeed />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Article Modal */}
      <NewsArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      />
    </div>
  );
}
