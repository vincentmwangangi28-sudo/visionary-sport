import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ChevronRight, Filter, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { STRATEGY_POSTS } from "@/data/blogData";
import { LeagueNavigationStrip } from "@/components/LeagueNavigationStrip";

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  Finance: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
  "Premier League": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
  "Champions League": "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/30",
  Markets: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
  KPL: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  Jackpots: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "US Soccer": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Match Preview": "bg-primary/10 text-primary border-primary/30",
};

interface DbPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  read_time: string;
  published_at: string;
}

export default function Blog() {
  const [matchPosts, setMatchPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('slug, title, description, category, read_time, published_at')
          .order('published_at', { ascending: false })
          .limit(12);
        setMatchPosts((data ?? []) as DbPost[]);
      } catch (err) {
        console.warn('Error fetching dynamic blog posts:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Merge database posts and static strategy posts cleanly without duplicates
  const allArticles = useMemo(() => {
    const list: Array<{
      slug: string;
      title: string;
      excerpt: string;
      category: string;
      readTime: string;
      date: string;
    }> = [];
    const seen = new Set<string>();

    for (const p of matchPosts) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        list.push({
          slug: p.slug,
          title: p.title,
          excerpt: p.description,
          category: p.category,
          readTime: p.read_time,
          date: p.published_at,
        });
      }
    }

    for (const p of STRATEGY_POSTS) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        list.push({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          readTime: p.readTime,
          date: p.date,
        });
      }
    }

    return list;
  }, [matchPosts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allArticles.forEach(a => set.add(a.category));
    return Array.from(set);
  }, [allArticles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") return allArticles;
    return allArticles.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [allArticles, selectedCategory]);

  const featured = allArticles[0] ?? STRATEGY_POSTS[0];
  const rest = filteredArticles.filter(p => p.slug !== featured.slug || selectedCategory !== "all");

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
        <Breadcrumbs className="mb-4" />
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3 mb-2 tracking-tight">
                <BookOpen className="h-8 w-8 text-primary" />
                <span>Football Betting Guides &amp; Match Previews</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Explore algorithmic wagering strategies, mathematical bankroll models, league guides, and AI match insights.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 font-mono text-xs bg-primary/5 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1 inline" /> {allArticles.length} Strategy Guides
              </Badge>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-5 no-scrollbar" role="group" aria-label="Filter guides by topic">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" aria-hidden="true" /> Topic:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 font-medium ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              All Topics ({allArticles.length})
            </button>
            {categories.map(cat => {
              const count = allArticles.filter(a => a.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory.toLowerCase() === cat.toLowerCase()}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 font-medium flex items-center gap-1 ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                      : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Post (only on 'All' view) */}
        {selectedCategory === "all" && featured && (
          <Link to={`/blog/${featured.slug}`} className="block mb-8 group">
            <Card className="overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg bg-card/60">
              <div className="h-2.5 bg-gradient-to-r from-primary via-emerald-500 to-accent" />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${CATEGORY_COLORS[featured.category] ?? 'bg-muted'} border text-xs`}>⭐ Featured Guide</Badge>
                  <Badge className={`${CATEGORY_COLORS[featured.category] ?? 'bg-muted'} border text-xs`}>{featured.category}</Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{featured.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.readTime} read</span>
                  <span>{new Date(featured.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="ml-auto text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read complete guide <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Article Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            : rest.map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                  <Card className="h-full hover:border-primary/40 transition-all hover:shadow-md bg-card/80 flex flex-col justify-between">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge className={`${CATEGORY_COLORS[post.category] ?? 'bg-muted'} border text-[11px]`}>
                          {post.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{post.readTime}
                        </span>
                      </div>
                      <h2 className="font-bold text-base mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-1">
                        {post.excerpt}
                      </p>
                      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Read</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {/* Complete Directory of Guides (Ensures crawlers and users have 100% crawl path to all articles) */}
        <div className="mt-14 pt-8 border-t border-border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Complete PredictPro Knowledge Base &amp; Strategy Index</span>
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Direct internal index to all statistical manuals, mathematical staking frameworks, and league betting analyses.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allArticles.map(article => (
              <Link
                key={`idx-${article.slug}`}
                to={`/blog/${article.slug}`}
                className="text-xs text-muted-foreground hover:text-primary hover:underline p-2 rounded-md bg-muted/20 hover:bg-muted/50 border border-border/40 flex items-center justify-between gap-2 transition-colors"
              >
                <span className="truncate">{article.title}</span>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
              </Link>
            ))}
          </div>
        </div>

        <LeagueNavigationStrip className="mt-12" />
      </main>
      <Footer />
    </div>
  );
}
