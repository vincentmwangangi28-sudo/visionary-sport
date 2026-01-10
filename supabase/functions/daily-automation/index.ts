import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background task runner
async function runAutomationTasks(supabaseUrl: string, supabaseKey: string) {
  const results = {
    predictions: { success: false, count: 0 },
    news: { success: false, count: 0 },
    polls: { success: false, count: 0 },
    accuracy: { success: false },
    errors: [] as string[]
  };

  // Call generate-daily-predictions
  try {
    console.log('Starting predictions generation...');
    const predResponse = await fetch(`${supabaseUrl}/functions/v1/cron-daily-predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    if (predResponse.ok) {
      const predData = await predResponse.json();
      results.predictions = { success: true, count: predData.predictions_generated || 0 };
      console.log('Predictions completed:', results.predictions);
    }
  } catch (e: unknown) {
    results.errors.push(`Predictions: ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.error('Predictions error:', e);
  }

  // Call fetch-real-news
  try {
    console.log('Starting news fetch...');
    const newsResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-real-news`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      results.news = { success: true, count: newsData.articlesGenerated || 0 };
      console.log('News completed:', results.news);
    }
  } catch (e: unknown) {
    results.errors.push(`News: ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.error('News error:', e);
  }

  // Call generate-polls
  try {
    console.log('Starting polls generation...');
    const pollsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-polls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    if (pollsResponse.ok) {
      const pollsData = await pollsResponse.json();
      results.polls = { success: true, count: pollsData.polls_created || 0 };
      console.log('Polls completed:', results.polls);
    }
  } catch (e: unknown) {
    results.errors.push(`Polls: ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.error('Polls error:', e);
  }

  // Call update-accuracy-stats
  try {
    console.log('Starting accuracy update...');
    const accResponse = await fetch(`${supabaseUrl}/functions/v1/update-accuracy-stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    if (accResponse.ok) {
      results.accuracy = { success: true };
      console.log('Accuracy completed');
    }
  } catch (e: unknown) {
    results.errors.push(`Accuracy: ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.error('Accuracy error:', e);
  }

  console.log('Daily automation completed:', JSON.stringify(results));
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Daily automation triggered at:', new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use EdgeRuntime.waitUntil for background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runAutomationTasks(supabaseUrl, supabaseKey));
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Automation tasks started in background',
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Fallback: run synchronously but with timeout handling
      const results = await runAutomationTasks(supabaseUrl, supabaseKey);
      
      return new Response(JSON.stringify({ 
        success: true,
        timestamp: new Date().toISOString(),
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('Error in daily-automation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
