import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const weekCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const results: Record<string, number> = {};

    // 1. Archive old predictions (>30 days, already verified)
    const { data: oldPredictions, error: predErr } = await supabase
      .from('predictions')
      .delete()
      .lt('match_date', cutoffDate)
      .not('result', 'is', null)
      .select('id');
    results.predictions_cleaned = oldPredictions?.length || 0;
    if (predErr) console.error('Predictions cleanup error:', predErr.message);

    // 2. Clean old games_news (>30 days) - archive first
    const { data: oldNews } = await supabase
      .from('games_news')
      .select('id, title, content, category, author, created_at')
      .lt('created_at', cutoffDate);
    
    if (oldNews && oldNews.length > 0) {
      await supabase.from('games_news_archive').insert(
        oldNews.map(n => ({
          title: n.title,
          content: n.content,
          category: n.category,
          author: n.author,
          created_at: n.created_at,
          archived_at: new Date().toISOString()
        }))
      );
      const { data: deleted } = await supabase
        .from('games_news')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id');
      results.news_archived = deleted?.length || 0;
    }

    // 3. Clean expired polls (>7 days past end date)
    const { data: expiredPolls } = await supabase
      .from('polls')
      .update({ is_active: false })
      .lt('ends_at', weekCutoff)
      .eq('is_active', true)
      .select('id');
    results.polls_deactivated = expiredPolls?.length || 0;

    // 4. Clean old match chat messages (>7 days)
    const { data: oldChats } = await supabase
      .from('match_chat_messages')
      .delete()
      .lt('created_at', weekCutoff)
      .select('id');
    results.chats_cleaned = oldChats?.length || 0;

    // 5. Clean old match FAQs (>30 days)
    const { data: oldFaqs } = await supabase
      .from('match_faqs')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');
    results.faqs_cleaned = oldFaqs?.length || 0;

    // 6. Clean old upcoming_matches_cache (past matches)
    const { data: oldCache } = await supabase
      .from('upcoming_matches_cache')
      .delete()
      .lt('match_date', new Date().toISOString())
      .select('id');
    results.cache_cleaned = oldCache?.length || 0;

    console.log('Auto-cleanup completed:', JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      cleaned: results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Auto-cleanup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
