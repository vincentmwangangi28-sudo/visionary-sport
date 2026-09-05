import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event.event === 'charge.success') {
      const data = event.data;
      const userId = data.metadata?.user_id;
      const plan = data.metadata?.plan || 'pro';

      if (userId) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        await supabase
          .from('profiles')
          .update({
            subscription_tier: plan,
            subscription_status: 'active',
            subscription_end: expiresAt,
          })
          .eq('id', userId);

        await supabase.from('transactions').insert({
          user_id: userId,
          amount: data.amount / 100,
          currency: data.currency,
          payment_method: 'paystack',
          status: 'completed',
          reference: data.reference,
          metadata: data,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
