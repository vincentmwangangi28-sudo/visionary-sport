import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results = {
    predictions: { success: false, count: 0 },
    news: { success: false, count: 0 },
    polls: { success: false, count: 0 },
    accuracy: { success: false },
    errors: [] as string[]
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Call generate-daily-predictions
    try {
      const predResponse = await fetch(`${supabaseUrl}/functions/v1/cron-daily-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      const predData = await predResponse.json();
      results.predictions = { success: true, count: predData.predictionsGenerated || 0 };
    } catch (e: unknown) {
      results.errors.push(`Predictions: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Call fetch-real-news
    try {
      const newsResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-real-news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      const newsData = await newsResponse.json();
      results.news = { success: true, count: newsData.articlesGenerated || 0 };
    } catch (e: unknown) {
      results.errors.push(`News: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Call generate-polls
    try {
      const pollsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-polls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      const pollsData = await pollsResponse.json();
      results.polls = { success: true, count: pollsData.pollsGenerated || 0 };
    } catch (e: unknown) {
      results.errors.push(`Polls: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Call update-accuracy-stats
    try {
      const accResponse = await fetch(`${supabaseUrl}/functions/v1/update-accuracy-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      await accResponse.json();
      results.accuracy = { success: true };
    } catch (e: unknown) {
      results.errors.push(`Accuracy: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    console.log('Daily automation completed:', results);

    return new Response(JSON.stringify({ 
      success: true,
      timestamp: new Date().toISOString(),
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in daily-automation:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
