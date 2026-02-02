import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from './TeamLogo';
import { Clock, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

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

interface FeaturedNewsHeroProps {
  article: NewsArticle;
  onClick?: () => void;
}

// Extract team names from article title
const extractTeamsFromTitle = (title: string): { home: string; away: string } | null => {
  const vsMatch = title.match(/(.+?)\s+(?:vs\.?|v\.?)\s+(.+?)(?:\s*[-:,]|\s*$)/i);
  if (vsMatch) {
    return {
      home: vsMatch[1].trim(),
      away: vsMatch[2].trim().split(/[-:,]/)[0].trim()
    };
  }
  return null;
};

export const FeaturedNewsHero = ({ article, onClick }: FeaturedNewsHeroProps) => {
  const teams = extractTeamsFromTitle(article.title);

  return (
    <div 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-accent/20 border border-primary/20 cursor-pointer group"
      onClick={onClick}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
              <Badge variant="outline" className="capitalize">
                {article.category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(article.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h2>

            {article.excerpt && (
              <p className="text-muted-foreground line-clamp-3 text-base">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4">
              {article.author === 'PredictPro AI' && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  AI-Powered Analysis
                </span>
              )}
              <Button variant="ghost" size="sm" className="gap-1 group-hover:gap-2 transition-all">
                Read Full Article
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Team logos for match previews */}
          {teams && (
            <div className="flex items-center justify-center lg:min-w-[200px]">
              <div className="flex items-center gap-4 p-4 bg-background/50 rounded-xl backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <TeamLogo teamName={teams.home} size="xl" />
                  <span className="text-sm font-medium text-center max-w-[80px]">
                    {teams.home}
                  </span>
                </div>
                
                <div className="flex flex-col items-center px-2">
                  <span className="text-xl font-bold text-primary">VS</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <TeamLogo teamName={teams.away} size="xl" />
                  <span className="text-sm font-medium text-center max-w-[80px]">
                    {teams.away}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            {article.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="text-xs bg-muted/50 px-3 py-1 rounded-full hover:bg-muted transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedNewsHero;
