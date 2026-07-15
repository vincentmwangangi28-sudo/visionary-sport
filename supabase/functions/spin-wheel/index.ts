import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyTokenCompat } from '../lib/verifyToken.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const PLANS: Record<string, { price: number; name: string }> = {
  basic: { price: 299, name: 'Basic' },
  pro:   { price: 599, name: 'Pro' },
  vip:   { price: 999, name: 'VIP' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  const token = authHeader.replace('Bearer ', '');

  const compat = await verifyTokenCompat(token);
  let userId: string | null = null;
  if (compat?.payload?.sub) userId = String(compat.payload.sub);
  else {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    userId = user.id;
  }

  const { plan, transactionId } = await req.json();
  if (!plan || !PLANS[plan]) return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: corsHeaders });
  if (!transactionId) return new Response(JSON.stringify({ error: 'transactionId required — pay first' }), { status: 400, headers: corsHeaders });

  // Verify payment completed
  const { data: tx } = await supabase.from('transactions').select('status, amount, user_id')
    .eq('id', transactionId).eq('user_id', userId).single();

  if (!tx) return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: corsHeaders });
  if (tx.status !== 'completed') return new Response(JSON.stringify({ error: 'Payment not completed yet', status: tx.status }), { status: 402, headers: corsHeaders });
  if (tx.amount < PLANS[plan].price) return new Response(JSON.stringify({ error: 'Insufficient payment amount' }), { status: 402, headers: corsHeaders });

  // Cancel any existing active subscription
  await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');

  // Activate new subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  const { data: sub, error: subErr } = await supabase.from('subscriptions').insert({
    user_id: userId, plan, price_kes: PLANS[plan].price,
    expires_at: expiresAt.toISOString(), status: 'active',
    metadata: { transaction_id: transactionId },
  }).select('id').single();

  if (subErr) return new Response(JSON.stringify({ error: 'Failed to activate subscription' }), { status: 500, headers: corsHeaders });

  // Mark transaction as used
  await supabase.from('transactions').update({ metadata: { subscription_id: sub.id } }).eq('id', transactionId);

  return new Response(JSON.stringify({ success: true, subscriptionId: sub.id, plan, expiresAt }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
