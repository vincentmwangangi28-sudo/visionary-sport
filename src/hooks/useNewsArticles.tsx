import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const fetchNewsArticles = async (category?: string): Promise<NewsArticle[]> => {
  let query = supabase
    .from('news_articles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as NewsArticle[];
};

export function useNewsArticles(category?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['news-articles', category ?? 'all'],
    queryFn: () => fetchNewsArticles(category),
    // SWR semantics: serve cache instantly, revalidate in background
    staleTime: 60_000,              // fresh for 1 min — no refetch
    gcTime: 10 * 60_000,            // keep in cache for 10 min
    refetchOnWindowFocus: true,     // background revalidation on tab focus
    refetchOnReconnect: true,       // and after network recovery
    refetchInterval: 5 * 60_000,    // periodic background refresh (5 min)
    placeholderData: (prev) => prev, // keep showing old data while refetching
  });

  const incrementViewCount = async (articleId: string) => {
    try {
      console.log('View tracked for article:', articleId);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Allow callers to imperatively prime the cache (e.g. after publishing)
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['news-articles'] });

  return {
    articles: data ?? [],
    loading: isLoading,
    refetch,
    invalidate,
    incrementViewCount,
  };
}
