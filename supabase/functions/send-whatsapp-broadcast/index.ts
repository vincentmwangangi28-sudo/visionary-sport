import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Prediction {
  home_team: string;
  away_team: string;
  prediction: string;
  confidence: number;
  league: string;
  match_date: string;
}

async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Missing Twilio credentials');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${fromNumber}`);
    formData.append('To', `whatsapp:${to}`);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio API error:', error);
      return false;
    }

    console.log(`Message sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

function formatPredictionMessage(predictions: Prediction[]): string {
  const today = new Date().toLocaleDateString('en-KE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let message = `🏆 *PredictPro Daily Predictions*\n`;
  message += `📅 ${today}\n\n`;

  // Group by league
  const byLeague: Record<string, Prediction[]> = {};
  predictions.forEach(p => {
    if (!byLeague[p.league]) byLeague[p.league] = [];
    byLeague[p.league].push(p);
  });

  Object.entries(byLeague).forEach(([league, preds]) => {
    message += `*${league}*\n`;
    preds.forEach(p => {
      const confidenceEmoji = p.confidence >= 80 ? '🔥' : p.confidence >= 70 ? '⭐' : '📊';
      message += `${confidenceEmoji} ${p.home_team} vs ${p.away_team}\n`;
      message += `   🔮 ${p.prediction} (${p.confidence}%)\n`;
    });
    message += '\n';
  });

  message += `\n📱 Open app for detailed analysis:\nhttps://visionary-sport.lovable.app\n\n`;
  message += `_Reply STOP to unsubscribe_`;

  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting WhatsApp broadcast...');

    // Get today's predictions (top confidence ones)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('home_team, away_team, prediction, confidence, league, match_date')
      .gte('match_date', startOfDay)
      .lte('match_date', endOfDay)
      .order('confidence', { ascending: false })
      .limit(10);

    if (predError) {
      console.error('Error fetching predictions:', predError);
      throw predError;
    }

    if (!predictions || predictions.length === 0) {
      console.log('No predictions available for today');
      return new Response(JSON.stringify({
        success: true,
        message: 'No predictions to send',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get active WhatsApp subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('whatsapp_subscriptions')
      .select('id, phone_number, country_code, user_id, message_count')
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscribers:', subError);
      throw subError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active subscribers',
        sent: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Sending to ${subscribers.length} subscribers...`);

    // Format the message
    const message = formatPredictionMessage(predictions);

    // Send to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      const fullNumber = `${subscriber.country_code}${subscriber.phone_number.replace(/^0+/, '')}`;
      
      const success = await sendWhatsAppMessage(fullNumber, message);
      
      if (success) {
        sentCount++;
        // Update last message sent timestamp
        await supabase
          .from('whatsapp_subscriptions')
          .update({ 
            last_message_sent_at: new Date().toISOString(),
            message_count: subscriber.message_count ? subscriber.message_count + 1 : 1
          })
          .eq('id', subscriber.id);
      } else {
        failedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Broadcast complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Broadcast complete',
      sent: sentCount,
      failed: failedCount,
      totalSubscribers: subscribers.length,
      predictionsIncluded: predictions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('WhatsApp broadcast error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
