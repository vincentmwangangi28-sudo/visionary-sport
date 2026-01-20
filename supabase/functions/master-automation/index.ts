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
      emailDigest: { success: false, sent: 0, failed: 0 },
      smsAlerts: { success: false, sent: 0, failed: 0 },
      matchVerification: { success: false, verified: 0 },
      accuracyReports: { success: false },
      scheduledPredictions: { success: false, count: 0 },
      backlinkContent: { success: false },
      responsibleGaming: { success: false },
      bettingGuides: { success: false, count: 0 },
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

    // 7. Send WhatsApp broadcast
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

    // 8. Send Email Digest
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email-digest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (emailResponse.ok) {
        const data = await emailResponse.json();
        results.emailDigest = { 
          success: true, 
          sent: data.sent || 0,
          failed: data.failed || 0
        };
      }
    } catch (e) {
      console.error('Email digest error:', e);
    }

    // 9. Send SMS Alerts
    try {
      const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-sms-alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (smsResponse.ok) {
        const data = await smsResponse.json();
        results.smsAlerts = { 
          success: true, 
          sent: data.sent || 0,
          failed: data.failed || 0
        };
      }
    } catch (e) {
      console.error('SMS alerts error:', e);
    }

    // 10. Verify Match Results
    try {
      const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-match-results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        results.matchVerification = { 
          success: true, 
          verified: data.verified || 0
        };
      }
    } catch (e) {
      console.error('Match verification error:', e);
    }

    // 11. Generate Accuracy Reports
    try {
      const reportResponse = await fetch(`${supabaseUrl}/functions/v1/generate-accuracy-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      results.accuracyReports = { success: reportResponse.ok };
    } catch (e) {
      console.error('Accuracy reports error:', e);
    }

    // 12. Scheduled Predictions
    try {
      const scheduledResponse = await fetch(`${supabaseUrl}/functions/v1/scheduled-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (scheduledResponse.ok) {
        const data = await scheduledResponse.json();
        results.scheduledPredictions = { 
          success: true, 
          count: data.predictionsGenerated || 0
        };
      }
    } catch (e) {
      console.error('Scheduled predictions error:', e);
    }

    // 13. Generate Backlink Content
    try {
      const backlinkResponse = await fetch(`${supabaseUrl}/functions/v1/generate-backlink-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      results.backlinkContent = { success: backlinkResponse.ok };
    } catch (e) {
      console.error('Backlink content error:', e);
    }

    // 14. Generate Responsible Gaming Article (weekly)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) { // Monday only
      try {
        const rgResponse = await fetch(`${supabaseUrl}/functions/v1/generate-responsible-gaming`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        results.responsibleGaming = { success: rgResponse.ok };
      } catch (e) {
        console.error('Responsible gaming error:', e);
      }
    }

    // 15. Generate Betting Strategy Guides (twice weekly)
    if (dayOfWeek === 2 || dayOfWeek === 5) { // Tuesday & Friday
      try {
        const guidesResponse = await fetch(`${supabaseUrl}/functions/v1/generate-betting-guides`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (guidesResponse.ok) {
          const data = await guidesResponse.json();
          results.bettingGuides = { success: true, count: data.generated?.length || 0 };
        }
      } catch (e) {
        console.error('Betting guides error:', e);
      }
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
