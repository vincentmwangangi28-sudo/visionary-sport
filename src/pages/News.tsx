import { useState } from 'react';
import { RelatedContent } from '@/components/RelatedContent';
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
import { ScrollReveal } from '@/components/ScrollReveal';
import { Newspaper, TrendingUp, Sparkles, RefreshCw, Zap, Calendar, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
    { id: 'Match Preview', label: 'Previews', icon: Calendar },
    { id: 'League Roundup', label: 'Roundups', icon: Trophy },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'trending', label: 'Trending', icon: Zap },
  ];

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
          "author": { "@type": "Organization", "name": "PredictPro Guru" },
          "datePublished": article.created_at,
          "publisher": { "@type": "Organization", "name": "PredictPro Guru", "url": "https://www.predictpro.guru" }
        }
      }))
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Football News & Betting Tips Kenya | PredictPro</title>
        <meta name="description" content="Latest football news, match previews, expert analysis, and transfer rumors. AI-powered sports insights from Kenya's #1 prediction platform." />
        <meta property="og:title" content="Football News & Betting Tips Kenya | PredictPro" />
        <meta property="og:description" content="Get the latest football news, match previews, and transfer updates. Free betting tips for Kenya sports fans." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://predictpro.guru/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="football news Kenya, betting tips Nairobi, Premier League news, transfer rumors, match previews Kenya" />
        <link rel="canonical" href="https://predictpro.guru/news" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsStructuredData) }} />

      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Header */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full mb-4 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Sports News</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 gradient-text-animated">
            Sports News Hub
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-5">
            Real-time match previews, AI analysis, and transfer news — updated automatically
          </p>
          
          <Button 
            variant="outline" 
            onClick={handleGenerateNews}
            disabled={isGenerating}
            className="gap-2 hover-glow"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Latest News'}
          </Button>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 w-full max-w-xl mx-auto h-auto p-1">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat.id || 'all'}
                  value={cat.id || 'all'}
                  onClick={() => setActiveCategory(cat.id)}
                  className="gap-1.5 text-xs sm:text-sm py-2"
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-56 bg-muted rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <Card className="py-16 glass-card">
            <CardContent className="text-center">
              <Newspaper className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">
                Click the button above to generate AI-powered news
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
              <ScrollReveal>
                <FeaturedNewsHero 
                  article={featuredArticle} 
                  onClick={() => setSelectedArticle(featuredArticle)}
                />
              </ScrollReveal>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main News Grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Latest Articles
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {articles.length} articles
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {remainingArticles.map((article, i) => (
                    <ScrollReveal key={article.id} delay={i * 0.05}>
                      <NewsMatchCard 
                        article={article}
                        onClick={() => setSelectedArticle(article)}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <ScrollReveal direction="right">
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Popular Teams
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {['Arsenal', 'Liverpool', 'Manchester City', 'Real Madrid', 'Barcelona', 'Bayern Munich'].map(team => (
                        <div key={team} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <TeamLogo teamName={team} size="sm" />
                          <span className="text-sm font-medium">{team}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </ScrollReveal>

                <ScrollReveal direction="right" delay={0.1}>
                  <InteractivePolls />
                </ScrollReveal>
                <ScrollReveal direction="right" delay={0.2}>
                  <TransferRumorsFeed />
                </ScrollReveal>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <NewsArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      />
    </div>
  );
}
