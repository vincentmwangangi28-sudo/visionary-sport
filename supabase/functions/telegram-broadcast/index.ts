import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { message, parse_mode = 'HTML', channel } = await req.json();

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const defaultChatId = Deno.env.get('TELEGRAM_CHAT_ID') || '@predictproAi';
    const chatId = channel || defaultChatId;

    if (!message) {
      return new Response(JSON.stringify({ success: false, error: 'Message body required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!botToken) {
      console.warn('[telegram-broadcast] TELEGRAM_BOT_TOKEN is not configured in secrets.');
      return new Response(JSON.stringify({
        success: false,
        simulated: true,
        message: 'Telegram bot token not configured. Broadcast logged to console.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode,
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: res.ok, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
