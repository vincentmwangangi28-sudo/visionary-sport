import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamLogo } from './TeamLogo';
import { Clock, User, Share2, X, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
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

interface NewsArticleModalProps {
  article: NewsArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// Simple markdown-like content formatter
const formatContent = (content: string) => {
  // Split by double newlines for paragraphs
  return content.split(/\n\n+/).map((paragraph, index) => {
    // Check for headers
    if (paragraph.startsWith('# ')) {
      return <h2 key={index} className="text-xl font-bold mt-6 mb-3">{paragraph.slice(2)}</h2>;
    }
    if (paragraph.startsWith('## ')) {
      return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{paragraph.slice(3)}</h3>;
    }
    if (paragraph.startsWith('### ')) {
      return <h4 key={index} className="text-base font-semibold mt-3 mb-2">{paragraph.slice(4)}</h4>;
    }
    // Check for bullet points
    if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
      const items = paragraph.split('\n').filter(item => item.startsWith('- '));
      return (
        <ul key={index} className="list-disc list-inside space-y-1 my-3">
          {items.map((item, i) => (
            <li key={i} className="text-muted-foreground">{item.slice(2)}</li>
          ))}
        </ul>
      );
    }
    // Regular paragraph
    return <p key={index} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>;
  });
};

export const NewsArticleModal = ({ article, open, onOpenChange }: NewsArticleModalProps) => {
  if (!article) return null;

  const teams = extractTeamsFromTitle(article.title);

  const handleShare = async () => {
    const url = `${window.location.origin}/news#${article.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || 'Check out this article from PredictPro',
          url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{article.title}</DialogTitle>
        </DialogHeader>
        
        {/* Header with team logos for match previews */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 border-b">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {teams && (
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex flex-col items-center gap-2">
                <TeamLogo teamName={teams.home} size="xl" />
                <span className="text-sm font-semibold">{teams.home}</span>
              </div>
              
              <div className="text-2xl font-bold text-primary">VS</div>
              
              <div className="flex flex-col items-center gap-2">
                <TeamLogo teamName={teams.away} size="xl" />
                <span className="text-sm font-semibold">{teams.away}</span>
              </div>
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-bold leading-tight text-center">
            {article.title}
          </h1>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <Badge variant="secondary" className="capitalize">
              {article.category}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(article.created_at), 'MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author}
            </span>
            {article.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count} views
              </span>
            )}
          </div>

          {article.author === 'PredictPro AI' && (
            <div className="flex items-center justify-center gap-1 mt-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500 font-medium">AI-Generated Analysis</span>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[50vh] px-6 py-4">
          {article.excerpt && (
            <p className="text-lg text-foreground font-medium mb-6 italic border-l-4 border-primary pl-4">
              {article.excerpt}
            </p>
          )}
          
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {formatContent(article.content)}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="text-xs bg-muted px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsArticleModal;
