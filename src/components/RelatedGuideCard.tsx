import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';
import { STRATEGY_POSTS, BlogPostItem } from '@/data/blogData';

interface RelatedGuideCardProps {
  slug: string;
  className?: string;
  badgeLabel?: string;
}

export const RelatedGuideCard: React.FC<RelatedGuideCardProps> = ({
  slug,
  className = '',
  badgeLabel = 'Recommended Strategy Guide',
}) => {
  const post: BlogPostItem | undefined = STRATEGY_POSTS.find((p) => p.slug === slug);

  if (!post) return null;

  return (
    <Card className={`border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all ${className}`}>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary gap-1">
              <BookOpen className="h-3 w-3" />
              {badgeLabel}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readTime} read
            </span>
          </div>
          <Link to={`/blog/${post.slug}`} className="block group">
            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <span>Read Full Guide</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
};
