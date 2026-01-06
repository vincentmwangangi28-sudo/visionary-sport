import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Users, Trophy, Newspaper, Zap } from "lucide-react";
import { InContentAd, FooterAd } from "@/components/AdBanner";
import { SocialShareButtons } from "@/components/SocialShareButtons";

// Sports news articles - in production, fetch from API/database
const newsArticles = [
  {
    id: 1,
    title: "Premier League Title Race Intensifies",
    excerpt: "Analysis of the top 4 contenders and their remaining fixtures. Our AI predicts the most likely champion based on form and schedule difficulty.",
    category: "Premier League",
    date: "2026-01-06",
    readTime: "5 min",
    icon: Trophy,
    trending: true,
  },
  {
    id: 2,
    title: "African Cup of Nations 2026 Preview",
    excerpt: "Breaking down the favorites, dark horses, and key players to watch. Expert predictions for the tournament outcome.",
    category: "AFCON",
    date: "2026-01-05",
    readTime: "8 min",
    icon: Users,
    trending: true,
  },
  {
    id: 3,
    title: "La Liga: Barcelona vs Real Madrid - El Clasico Preview",
    excerpt: "Statistical analysis and AI prediction for the biggest match in Spanish football. Head-to-head records and key battles.",
    category: "La Liga",
    date: "2026-01-04",
    readTime: "6 min",
    icon: TrendingUp,
    trending: false,
  },
  {
    id: 4,
    title: "How AI is Revolutionizing Sports Predictions",
    excerpt: "Understanding the technology behind PredictPro's 87% accuracy rate. Machine learning models and real-time data analysis explained.",
    category: "Technology",
    date: "2026-01-03",
    readTime: "7 min",
    icon: Zap,
    trending: false,
  },
  {
    id: 5,
    title: "Kenya Premier League: Season Outlook",
    excerpt: "Local football analysis with predictions for Gor Mahia, AFC Leopards, and other top clubs. Support your favorite team with data!",
    category: "KPL",
    date: "2026-01-02",
    readTime: "4 min",
    icon: Newspaper,
    trending: false,
  },
  {
    id: 6,
    title: "Betting Tips: Managing Your Bankroll",
    excerpt: "Expert advice on responsible gambling. Learn strategies to maximize wins and minimize losses with smart betting practices.",
    category: "Tips",
    date: "2026-01-01",
    readTime: "6 min",
    icon: TrendingUp,
    trending: false,
  },
];

const News = () => {
  // Structured data for news articles
  const newsStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "PredictPro Sports News & Analysis",
    "description": "Latest sports news, betting tips, and AI-powered match analysis for football fans in Kenya and Africa",
    "url": "https://www.predictpro.guru/news",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": newsArticles.map((article, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "NewsArticle",
          "headline": article.title,
          "description": article.excerpt,
          "datePublished": article.date,
          "author": {
            "@type": "Organization",
            "name": "PredictPro"
          }
        }
      }))
    }
  };

  return (
    <>
      <Helmet>
        <title>Sports News & Analysis | PredictPro Guru Kenya</title>
        <meta name="description" content="Latest football news, betting tips, and AI-powered match analysis. Premier League, La Liga, AFCON, and Kenya Premier League coverage." />
        <meta name="keywords" content="sports news Kenya, football betting tips, Premier League news, AFCON predictions, KPL analysis, AI sports predictions" />
        <link rel="canonical" href="https://www.predictpro.guru/news" />
        
        <meta property="og:title" content="Sports News & Analysis | PredictPro Guru" />
        <meta property="og:description" content="Latest football news, betting tips, and AI-powered match analysis for Kenyan fans." />
        <meta property="og:url" content="https://www.predictpro.guru/news" />
        
        <script type="application/ld+json">
          {JSON.stringify(newsStructuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16">
          {/* Hero Section */}
          <div className="container mx-auto px-4 max-w-6xl mb-12">
            <div className="text-center">
              <Badge className="mb-4" variant="secondary">
                <Newspaper className="w-4 h-4 mr-1" />
                Content Hub
              </Badge>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                Sports News & Analysis
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Latest football news, betting tips, and AI-powered insights to help you make smarter predictions
              </p>
            </div>
          </div>

          {/* Trending Articles */}
          <section className="container mx-auto px-4 max-w-6xl mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Trending Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsArticles.filter(a => a.trending).map((article) => (
                <Card key={article.id} className="hover-lift hover-glow transition-all duration-300 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" className="bg-primary">
                        {article.category}
                      </Badge>
                      <Badge variant="outline" className="text-primary border-primary">
                        🔥 Trending
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{article.date}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <SocialShareButtons 
                        title={article.title}
                        text={article.excerpt}
                        url={`https://www.predictpro.guru/news/${article.id}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Ad Section */}
          <div className="container mx-auto px-4 py-6">
            <InContentAd />
          </div>

          {/* All Articles */}
          <section className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsArticles.map((article) => {
                const IconComponent = article.icon;
                return (
                  <Card key={article.id} className="hover-lift transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.date}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="container mx-auto px-4 max-w-2xl mt-16">
            <Card className="bg-gradient-prediction border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                <p className="text-muted-foreground mb-6">
                  Get daily predictions and sports news delivered to your inbox
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                  />
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Subscribe
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer Ad */}
          <div className="container mx-auto px-4 py-8">
            <FooterAd />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default News;
