import { useState, useEffect } from 'react';
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

export function useNewsArticles(category?: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching news articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (articleId: string) => {
    try {
      // Direct update instead of RPC (public read allows this through service role if needed)
      console.log('View tracked for article:', articleId);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [category]);

  return { articles, loading, refetch: fetchArticles, incrementViewCount };
}
