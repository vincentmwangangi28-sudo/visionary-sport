import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const PLANS: Record<string, { price_usd: number; price_kes: number; name: string }> = {
  basic: { price_usd: 299, price_kes: 299, name: 'Basic' },
  pro:   { price_usd: 599, price_kes: 599, name: 'Pro' },
  vip:   { price_usd: 999, price_kes: 999, name: 'VIP' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const { plan, currency = 'usd', successUrl, cancelUrl } = await req.json();
  if (!plan || !PLANS[plan]) return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: corsHeaders });

  const planDetails = PLANS[plan];
  const amount = currency === 'kes' ? planDetails.price_kes * 100 : planDetails.price_usd;

  // Create Stripe Checkout Session
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'success_url': successUrl || 'https://predictpro.guru/shop?success=true',
      'cancel_url': cancelUrl || 'https://predictpro.guru/shop',
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][product_data][name]': `PredictPro ${planDetails.name} Plan`,
      'line_items[0][price_data][product_data][description]': `1 month ${planDetails.name} subscription`,
      'line_items[0][price_data][unit_amount]': amount.toString(),
      'line_items[0][quantity]': '1',
      'customer_email': user.email!,
      'metadata[user_id]': user.id,
      'metadata[plan]': plan,
      'metadata[currency]': currency,
    }),
  });

  const session = await response.json();
  if (!session.url) return new Response(JSON.stringify({ error: 'Failed to create payment session', details: session }), { status: 500, headers: corsHeaders });

  // Log pending transaction
  await supabase.from('transactions').insert({
    user_id: user.id, type: 'premium_subscription', amount: planDetails.price_kes,
    status: 'pending', payment_method: 'stripe',
    metadata: { stripe_session_id: session.id, plan, currency },
  });

  return new Response(JSON.stringify({ success: true, url: session.url, sessionId: session.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
