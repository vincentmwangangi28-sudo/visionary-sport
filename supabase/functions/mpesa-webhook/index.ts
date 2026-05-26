import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const WEBHOOK_SECRET = Deno.env.get('MPESA_WEBHOOK_SECRET');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Verify HMAC signature
  if (WEBHOOK_SECRET) {
    const signature = req.headers.get('x-lipana-signature');
    const body = await req.text();
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (!signature || signature !== expected) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
    }
    var payload = JSON.parse(body);
  } else {
    var payload = await req.json();
  }

  const { event, data } = payload;

  if (event === 'payment.completed') {
    const { checkoutRequestID, transactionCode, amount, phoneNumber } = data;

    // Find the pending transaction by checkout request ID
    const { data: tx } = await supabase.from('transactions')
      .select('*').eq('metadata->>checkout_request_id', checkoutRequestID).single();

    if (!tx) {
      console.error('Transaction not found for checkoutRequestID:', checkoutRequestID);
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }

    // Mark transaction as completed
    await supabase.from('transactions').update({
      status: 'completed',
      metadata: { ...tx.metadata, transaction_code: transactionCode, phone: phoneNumber },
    }).eq('id', tx.id);

    // Auto-activate subscription if this was a subscription payment
    if (tx.type === 'premium_subscription' && tx.user_id) {
      const planMap: Record<number, string> = { 299: 'basic', 599: 'pro', 999: 'vip' };
      const plan = planMap[tx.amount];
      if (plan) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', tx.user_id).eq('status', 'active');
        await supabase.from('subscriptions').insert({
          user_id: tx.user_id, plan, price_kes: tx.amount,
          expires_at: expiresAt.toISOString(), status: 'active',
          metadata: { transaction_id: tx.id, transaction_code: transactionCode },
        });

        // Notify user via in-app notification
        await supabase.from('notifications').insert({
          user_id: tx.user_id,
          type: 'subscription_activated',
          message: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription is now active!`,
          metadata: { plan, expires_at: expiresAt.toISOString() },
        });
      }
    }

    // Handle coin purchases
    if (tx.type === 'coin_purchase' && tx.user_id) {
      const coinsMap: Record<number, number> = { 100: 120, 250: 310, 500: 650, 1000: 1400 };
      const coins = coinsMap[tx.amount] ?? Math.floor(tx.amount * 1.2);
      await supabase.rpc('add_coins', { user_id_val: tx.user_id, amount_val: coins });
      await supabase.from('notifications').insert({
        user_id: tx.user_id,
        type: 'coins_added',
        message: `${coins} coins added to your account!`,
        metadata: { coins, transaction_id: tx.id },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
