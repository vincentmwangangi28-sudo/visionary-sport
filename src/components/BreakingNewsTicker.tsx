import { useState, useEffect } from 'react';
import { sportsNewsService, SportsArticle } from '@/services/sportsNewsService';
import { Newspaper, Sparkles, ArrowRight, Zap, ExternalLink, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function BreakingNewsTicker() {
  const [articles, setArticles] = useState<SportsArticle[]>(() =>
    sportsNewsService.getCachedArticles().slice(0, 4)
  );

  useEffect(() => {
    const unsub = sportsNewsService.subscribe((fresh) => {
      setArticles(fresh.slice(0, 4));
    });

    // Background silent check
    sportsNewsService.fetchAndCacheNews(false).then((fresh) => {
      if (fresh?.length) setArticles(fresh.slice(0, 4));
    }).catch(() => {});

    return () => unsub();
  }, []);

  if (!articles.length) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                Breaking Football News & Gemini Tactical Wire
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Zap className="h-2.5 w-2.5" /> Fast Backend Cache
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automated multi-feed download & AI tactical betting analysis
            </p>
          </div>
        </div>

        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          View All News <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {articles.map((item, idx) => (
          <Link
            key={idx}
            to="/news"
            className="group block"
          >
            <Card className="h-full bg-background/50 border-border/50 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between p-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <Badge
                    variant={item.isGeminiCurated ? "default" : "secondary"}
                    className="text-[10px] font-extrabold h-4.5 px-1.5 gap-1"
                  >
                    {item.isGeminiCurated && <Sparkles className="h-2.5 w-2.5" />}
                    {item.isGeminiCurated ? 'Gemini AI Wire' : item.source}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {item.category || 'News'}
                  </span>
                </div>

                <h4 className="text-xs font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h4>

                {item.bettingImpact ? (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 line-clamp-2 flex items-start gap-1 pt-0.5">
                    <TrendingUp className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{item.bettingImpact}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 text-[10px] text-primary font-semibold flex items-center gap-1">
                <span>Read analysis</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
