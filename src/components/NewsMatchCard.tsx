import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TeamLogo } from './TeamLogo';
import { Clock, Sparkles, TrendingUp, Eye } from 'lucide-react';
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

interface NewsMatchCardProps {
  article: NewsArticle;
  onClick?: () => void;
}

// Extract team names from article title (pattern: "Team1 vs Team2")
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

export const NewsMatchCard = ({ article, onClick }: NewsMatchCardProps) => {
  const teams = extractTeamsFromTitle(article.title);
  const isMatchPreview = article.category.toLowerCase().includes('preview') || 
                         article.category.toLowerCase().includes('match') ||
                         teams !== null;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with category and date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="capitalize bg-primary/10 text-primary border-0"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {article.category}
            </Badge>
            {article.view_count > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(article.created_at), 'MMM d')}
          </span>
        </div>

        {/* Match preview with team logos */}
        {isMatchPreview && teams && (
          <div className="flex items-center justify-center gap-4 py-4 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 rounded-lg mb-3">
            <div className="flex flex-col items-center gap-1">
              <TeamLogo teamName={teams.home} size="lg" />
              <span className="text-xs font-medium text-center max-w-[80px] truncate">
                {teams.home}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-primary">VS</span>
              <span className="text-[10px] text-muted-foreground">AI Preview</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <TeamLogo teamName={teams.away} size="lg" />
              <span className="text-xs font-medium text-center max-w-[80px] truncate">
                {teams.away}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* AI Generated indicator */}
        {article.author === 'PredictPro AI' && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-green-500 font-medium">AI-Generated Analysis</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsMatchCard;
