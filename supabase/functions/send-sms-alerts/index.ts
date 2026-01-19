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
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '') || '';

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active SMS subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('sms_subscriptions')
      .select('*')
      .eq('is_active', true)
      .eq('alerts_enabled', true);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    console.log(`📱 Found ${subscriptions?.length || 0} active SMS subscriptions`);

    // Get high-confidence predictions for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .gte('match_date', today.toISOString())
      .lt('match_date', tomorrow.toISOString())
      .gte('confidence', 75)
      .order('confidence', { ascending: false })
      .limit(5);

    if (predError || !predictions?.length) {
      console.log('No high-confidence predictions to send');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No high-confidence predictions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format SMS message
    const predictionsText = predictions.map(p => 
      `⚽ ${p.home_team} vs ${p.away_team}\n📊 ${p.prediction} (${p.confidence}%)`
    ).join('\n\n');

    const smsMessage = `🔮 PredictPro High-Confidence Alerts!\n\n${predictionsText}\n\n🎯 Good luck! - predictpro.guru`;

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        const phoneNumber = `${sub.country_code}${sub.phone_number}`;
        
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phoneNumber,
              From: twilioFromNumber,
              Body: smsMessage,
            }),
          }
        );

        if (response.ok) {
          sent++;
          console.log(`✅ SMS sent to ${phoneNumber}`);
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, errorData);
          failed++;
        }
      } catch (err) {
        console.error(`Error sending SMS:`, err);
        failed++;
      }
    }

    console.log(`📱 SMS alerts complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subscriptions?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SMS alerts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
