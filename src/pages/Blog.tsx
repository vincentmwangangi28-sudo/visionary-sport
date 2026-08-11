import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const STRATEGY_POSTS = [
  { slug: "how-to-read-football-predictions", title: "How to Read AI Football Predictions Like a Pro", excerpt: "Understanding confidence scores, probability percentages and odds — what they mean and how to use them in your betting strategy.", category: "Strategy", readTime: "5 min", date: "2026-06-04", featured: true },
  { slug: "value-betting-explained", title: "Value Betting in Football: A Complete Guide", excerpt: "What is value betting, how to calculate expected value (EV) and why a 60% confidence prediction at 2.0 odds is better than 80% at 1.3.", category: "Strategy", readTime: "8 min", date: "2026-06-03" },
  { slug: "bankroll-management-football", title: "Bankroll Management for Football Bettors", excerpt: "The Kelly Criterion, flat staking and why most bettors go broke. Learn to protect your capital while maximising long-term returns.", category: "Finance", readTime: "6 min", date: "2026-06-02" },
  { slug: "premier-league-prediction-guide-2026", title: "Premier League 2025/26 Prediction Guide", excerpt: "Which teams are most predictable this season? Home advantage stats, H2H trends and the leagues statistical patterns our AI exploits.", category: "Premier League", readTime: "10 min", date: "2026-06-01" },
  { slug: "champions-league-group-stage-tips", title: "Champions League Group Stage: How to Bet Smart", excerpt: "Group stage football is different — motivation, rotation and away goals. Our AI approach to UCL predictions explained.", category: "Champions League", readTime: "7 min", date: "2026-05-31" },
  { slug: "btts-over-under-strategy", title: "BTTS and Over/Under: The Stats Behind Goal Markets", excerpt: "Why Both Teams to Score is one of the most predictable markets. The teams, leagues and match types where BTTS hits most reliably.", category: "Markets", readTime: "6 min", date: "2026-05-30" },
  { slug: "kpl-betting-guide-kenya", title: "Kenya Premier League Betting Guide 2026", excerpt: "Everything you need to know about betting on KPL — Gor Mahia, AFC Leopards, Tusker and how to use M-Pesa for predictions.", category: "KPL", readTime: "5 min", date: "2026-05-29" },
  { slug: "accumulator-building-strategy", title: "How to Build a Winning Football Accumulator", excerpt: "Why most accas lose and how to use AI confidence scores to select the right legs. The 5-fold strategy that actually works.", category: "Strategy", readTime: "7 min", date: "2026-05-28" },
  { slug: "correct-score-prediction-tips", title: "Correct Score Betting: Can AI Really Predict the Scoreline?", excerpt: "Correct score is the hardest market to beat. Here's how our AI approaches it and when correct score bets offer value.", category: "Markets", readTime: "6 min", date: "2026-05-27" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Finance: "bg-green-500/10 text-green-700 border-green-500/30",
  "Premier League": "bg-purple-500/10 text-purple-700 border-purple-500/30",
  "Champions League": "bg-yellow-500/10 text-yellow-800 border-yellow-500/30",
  Markets: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  KPL: "bg-red-500/10 text-red-700 border-red-500/30",
  "Match Preview": "bg-primary/10 text-primary border-primary/30",
};

interface DbPost { slug: string; title: string; description: string; category: string; read_time: string; published_at: string; }

export default function Blog() {
  const [matchPosts, setMatchPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, description, category, read_time, published_at')
        .order('published_at', { ascending: false })
        .limit(12);
      setMatchPosts((data ?? []) as DbPost[]);
      setLoading(false);
    })();
  }, []);

  const dynamicAsCards = matchPosts.map(p => ({
    slug: p.slug, title: p.title, excerpt: p.description, category: p.category,
    readTime: p.read_time, date: p.published_at,
  }));

  const featured = dynamicAsCards[0] ?? STRATEGY_POSTS[0];
  const rest = [...dynamicAsCards.slice(1), ...STRATEGY_POSTS.filter(p => p.slug !== featured.slug)];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Football Betting Tips, Match Previews & Strategy Blog | PredictPro"
        description="Daily AI match previews, expert football betting guides and strategy articles. Value betting, bankroll management, accumulator strategy and more."
        canonical="/blog"
        keywords="football betting tips blog, football match previews, football betting strategy, value betting guide, bankroll management football, accumulator tips, Premier League betting guide, KPL betting Kenya"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />Blog &amp; Match Previews
          </h1>
          <p className="text-muted-foreground">Daily AI match previews, betting strategy and prediction guides.</p>
        </div>

        {loading ? (
          <div className="space-y-4 mb-8"><Skeleton className="h-48 rounded-xl" /></div>
        ) : (
          <Link to={`/blog/${featured.slug}`} className="block mb-8 group">
            <Card className="overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="h-3 bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${CATEGORY_COLORS[featured.category] ?? 'bg-muted'} border text-xs`}>⭐ Featured</Badge>
                  <Badge className={`${CATEGORY_COLORS[featured.category] ?? 'bg-muted'} border text-xs`}>{featured.category}</Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{featured.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2">{featured.excerpt}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.readTime} read</span>
                  <span>{new Date(featured.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="ml-auto text-primary flex items-center gap-1 group-hover:gap-2 transition-all">Read more <ChevronRight className="h-4 w-4" /></span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            : rest.map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                  <Card className="h-full hover:border-primary/30 transition-all hover:shadow-md">
                    <CardContent className="p-5">
                      <Badge className={`${CATEGORY_COLORS[post.category] ?? 'bg-muted'} border text-xs mb-3`}>{post.category}</Badge>
                      <h2 className="font-bold mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                        <span>{new Date(post.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
