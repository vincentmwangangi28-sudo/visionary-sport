import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const PLANS: Record<string, { price: number; durationDays: number }> = {
  basic: { price: 299, durationDays: 30 },
  pro: { price: 599, durationDays: 30 },
  vip: { price: 999, durationDays: 30 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const { plan, transactionId } = await req.json();
  const planConfig = PLANS[plan];
  if (!planConfig) return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: corsHeaders });

  // Verify payment was actually completed
  const { data: tx } = await supabase.from('transactions').select('status, amount, user_id')
    .eq('id', transactionId).single();

  if (!tx) return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: corsHeaders });
  if (tx.status !== 'completed') return new Response(JSON.stringify({ error: 'Payment not completed' }), { status: 402, headers: corsHeaders });
  if (tx.user_id !== user.id) return new Response(JSON.stringify({ error: 'Transaction mismatch' }), { status: 403, headers: corsHeaders });
  if (tx.amount < planConfig.price) return new Response(JSON.stringify({ error: 'Insufficient payment' }), { status: 402, headers: corsHeaders });

  // Cancel any existing active subscription
  await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user.id).eq('status', 'active');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

  const { data: sub, error: subErr } = await supabase.from('subscriptions').insert({
    user_id: user.id, plan, price_kes: planConfig.price,
    expires_at: expiresAt.toISOString(), status: 'active',
    metadata: { transaction_id: transactionId },
  }).select().single();

  if (subErr) return new Response(JSON.stringify({ error: 'Failed to activate subscription' }), { status: 500, headers: corsHeaders });

  // Mark transaction as used
  await supabase.from('transactions').update({ metadata: { subscription_id: sub.id, ...tx } }).eq('id', transactionId);

  return new Response(JSON.stringify({ success: true, subscription: sub }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
