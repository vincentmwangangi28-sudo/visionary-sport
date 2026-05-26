import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const WEBHOOK_SECRET = Deno.env.get('MPESA_WEBHOOK_SECRET');

  const body = await req.text();

  // Verify HMAC signature
  if (WEBHOOK_SECRET) {
    const signature = req.headers.get('x-lipana-signature') ?? '';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computed !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(body); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const checkoutRequestId = payload.CheckoutRequestID as string;
  const resultCode = payload.ResultCode as number;
  const mpesaRef = payload.MpesaReceiptNumber as string;
  const amount = payload.Amount as number;

  if (!checkoutRequestId) return new Response('Missing CheckoutRequestID', { status: 400 });

  // Find pending transaction
  const { data: tx } = await supabase.from('transactions')
    .select('id, user_id, type, amount, metadata')
    .contains('metadata', { checkout_request_id: checkoutRequestId })
    .eq('status', 'pending').single();

  if (!tx) {
    console.warn('Transaction not found for', checkoutRequestId);
    return new Response('OK', { status: 200 });
  }

  if (resultCode === 0) {
    // Payment successful — update transaction
    await supabase.from('transactions').update({
      status: 'completed',
      metadata: { ...tx.metadata as object, mpesa_ref: mpesaRef, amount_confirmed: amount },
    }).eq('id', tx.id);

    // Auto-activate subscription if this was a subscription payment
    if (tx.type === 'premium_subscription') {
      const plan = (tx.metadata as Record<string, string>)?.plan ?? 'pro';
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', tx.user_id).eq('status', 'active');
      await supabase.from('subscriptions').insert({
        user_id: tx.user_id, plan, price_kes: amount,
        expires_at: expiresAt.toISOString(), status: 'active',
        metadata: { transaction_id: tx.id, mpesa_ref: mpesaRef },
      });
    }

    // Notify user via in-app notification
    await supabase.from('notifications').insert({
      user_id: tx.user_id, type: 'payment_success',
      message: `Payment of KES ${amount} confirmed (Ref: ${mpesaRef})`,
      metadata: { transaction_id: tx.id, mpesa_ref: mpesaRef },
    });
  } else {
    // Payment failed
    await supabase.from('transactions').update({ status: 'failed', metadata: { ...tx.metadata as object, result_code: resultCode } }).eq('id', tx.id);
    await supabase.from('notifications').insert({
      user_id: tx.user_id, type: 'payment_failed',
      message: 'Payment was not completed. Please try again.',
      metadata: { transaction_id: tx.id, result_code: resultCode },
    });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
