import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskResult {
  success: boolean;
  count?: number;
  sent?: number;
  failed?: number;
  verified?: number;
  error?: string;
}

async function callFunction(supabaseUrl: string, supabaseKey: string, name: string): Promise<TaskResult> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        count: data.count || data.articlesGenerated || data.predictionsGenerated || data.polls_created || 0,
        sent: data.sent || 0,
        failed: data.failed || 0,
        verified: data.verified || 0,
      };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(`${name} error:`, msg);
    return { success: false, error: msg };
  }
}

async function runAllTasks(supabaseUrl: string, supabaseKey: string) {
  const results: Record<string, TaskResult> = {};
  const dayOfWeek = new Date().getDay();

  // Phase 1: Core predictions and content (run sequentially to avoid AI rate limits)
  console.log('Phase 1: Core predictions...');
  results.predictions = await callFunction(supabaseUrl, supabaseKey, 'generate-multi-sport-predictions');
  
  // Small delay between AI-heavy calls
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Phase 1: AI news...');
  results.news = await callFunction(supabaseUrl, supabaseKey, 'generate-ai-news');

  await new Promise(r => setTimeout(r, 2000));

  // Phase 2: Non-AI tasks (can be faster)
  console.log('Phase 2: Non-AI tasks...');
  const [faqs, sitemap, badges, upsetAlerts, verification] = await Promise.all([
    callFunction(supabaseUrl, supabaseKey, 'generate-match-faqs'),
    callFunction(supabaseUrl, supabaseKey, 'auto-sitemap'),
    callFunction(supabaseUrl, supabaseKey, 'award-badges'),
    callFunction(supabaseUrl, supabaseKey, 'detect-upset-alerts'),
    callFunction(supabaseUrl, supabaseKey, 'verify-match-results'),
  ]);
  results.faqs = faqs;
  results.sitemap = sitemap;
  results.badges = badges;
  results.upsetAlerts = upsetAlerts;
  results.matchVerification = verification;

  // Phase 3: Communication (parallel)
  console.log('Phase 3: Communications...');
  const [whatsapp, email, sms] = await Promise.all([
    callFunction(supabaseUrl, supabaseKey, 'send-whatsapp-broadcast'),
    callFunction(supabaseUrl, supabaseKey, 'send-email-digest'),
    callFunction(supabaseUrl, supabaseKey, 'send-sms-alerts'),
  ]);
  results.whatsappBroadcast = whatsapp;
  results.emailDigest = email;
  results.smsAlerts = sms;

  // Phase 4: Reports and scheduled tasks
  console.log('Phase 4: Reports...');
  results.accuracyReports = await callFunction(supabaseUrl, supabaseKey, 'generate-accuracy-reports');
  results.scheduledPredictions = await callFunction(supabaseUrl, supabaseKey, 'scheduled-predictions');

  // Phase 5: Cleanup & maintenance (daily)
  console.log('Phase 5: Cleanup & maintenance...');
  const [cleanup, transferRumors] = await Promise.all([
    callFunction(supabaseUrl, supabaseKey, 'auto-cleanup'),
    callFunction(supabaseUrl, supabaseKey, 'fetch-transfer-rumors'),
  ]);
  results.autoCleanup = cleanup;
  results.transferRumors = transferRumors;

  // Phase 6: Weekly content (conditional)
  await new Promise(r => setTimeout(r, 2000));

  console.log('Phase 6: Conditional content...');
  results.backlinkContent = await callFunction(supabaseUrl, supabaseKey, 'generate-backlink-content');

  if (dayOfWeek === 0) { // Sunday - weekly performance digest
    results.weeklyDigest = await callFunction(supabaseUrl, supabaseKey, 'weekly-performance-digest');
  }

  if (dayOfWeek === 1) { // Monday
    results.responsibleGaming = await callFunction(supabaseUrl, supabaseKey, 'generate-responsible-gaming');
  }

  if (dayOfWeek === 2 || dayOfWeek === 5) { // Tuesday & Friday
    results.bettingGuides = await callFunction(supabaseUrl, supabaseKey, 'generate-betting-guides');
  }

  console.log('Master automation completed:', JSON.stringify(results));
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Master automation triggered at:', new Date().toISOString());

    // Use EdgeRuntime.waitUntil for background processing to avoid timeout
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runAllTasks(supabaseUrl, supabaseKey));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Master automation started in background',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Fallback: run synchronously
      const results = await runAllTasks(supabaseUrl, supabaseKey);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Master automation completed',
        results,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: unknown) {
    console.error('Master automation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
