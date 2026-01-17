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

    const results = {
      predictions: { success: false, count: 0 },
      news: { success: false, count: 0 },
      faqs: { success: false, count: 0 },
      sitemap: { success: false },
      badges: { success: false, count: 0 },
      upsetAlerts: { success: false, count: 0 },
      whatsappBroadcast: { success: false, sent: 0, failed: 0 },
      timestamp: new Date().toISOString()
    };

    // 1. Generate multi-sport predictions
    try {
      const predictionsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-multi-sport-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (predictionsResponse.ok) {
        const data = await predictionsResponse.json();
        results.predictions = { success: true, count: data.count || 0 };
      }
    } catch (e) {
      console.error('Predictions error:', e);
    }

    // 2. Generate AI news
    try {
      const newsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-ai-news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (newsResponse.ok) {
        const data = await newsResponse.json();
        results.news = { success: true, count: data.articlesGenerated || 0 };
      }
    } catch (e) {
      console.error('News error:', e);
    }

    // 3. Generate match FAQs for SEO
    try {
      const faqResponse = await fetch(`${supabaseUrl}/functions/v1/generate-match-faqs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (faqResponse.ok) {
        const data = await faqResponse.json();
        results.faqs = { success: true, count: data.count || 0 };
      }
    } catch (e) {
      console.error('FAQs error:', e);
    }

    // 4. Update sitemap
    try {
      const sitemapResponse = await fetch(`${supabaseUrl}/functions/v1/auto-sitemap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      results.sitemap = { success: sitemapResponse.ok };
    } catch (e) {
      console.error('Sitemap error:', e);
    }

    // 5. Award user badges
    try {
      const badgeResponse = await fetch(`${supabaseUrl}/functions/v1/award-badges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (badgeResponse.ok) {
        const data = await badgeResponse.json();
        results.badges = { success: true, count: data.count || 0 };
      }
    } catch (e) {
      console.error('Badges error:', e);
    }

    // 6. Detect and mark upset alerts
    try {
      const upsetResponse = await fetch(`${supabaseUrl}/functions/v1/detect-upset-alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (upsetResponse.ok) {
        const data = await upsetResponse.json();
        results.upsetAlerts = { success: true, count: data.count || 0 };
      }
    } catch (e) {
      console.error('Upset alerts error:', e);
    }

    // 7. Send WhatsApp broadcast (daily predictions)
    try {
      const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (whatsappResponse.ok) {
        const data = await whatsappResponse.json();
        results.whatsappBroadcast = { 
          success: true, 
          sent: data.sent || 0,
          failed: data.failed || 0
        };
      }
    } catch (e) {
      console.error('WhatsApp broadcast error:', e);
    }

    // Log automation run
    console.log('Master automation completed:', JSON.stringify(results));

    return new Response(JSON.stringify({
      success: true,
      message: 'Master automation completed',
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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
