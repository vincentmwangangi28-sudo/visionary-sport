import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature' };
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computed.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    return mismatch === 0;
  } catch { return false; }
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WEBHOOK_SECRET = Deno.env.get('MPESA_WEBHOOK_SECRET');
  try {
    const rawBody = await req.text();
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get('x-lipana-signature') ?? '';
      if (!(await verifySignature(WEBHOOK_SECRET, rawBody, signature))) {
        console.warn('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;
    const { transactionId, checkoutRequestID, status, amount } = data ?? {};
    if (!transactionId && !checkoutRequestID) return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    let query = supabase.from('transactions').select('*').eq('status', 'pending');
    if (checkoutRequestID) query = query.eq('metadata->checkout_request_id', checkoutRequestID);
    else if (transactionId) query = query.eq('metadata->transaction_id', transactionId);
    const { data: transactions } = await query;
    const transaction = transactions?.[0];
    if (transaction) {
      let newStatus = 'pending';
      if (event === 'payment.success' || status === 'success') {
        newStatus = 'completed';
        if (transaction.type === 'premium_subscription') {
          await supabase.from('user_roles').upsert({ user_id: transaction.user_id, role: 'premium' }, { onConflict: 'user_id,role' });
        } else if (transaction.type === 'coin_purchase') {
          const coinsToAdd = amount ?? transaction.amount;
          const { data: profile } = await supabase.from('profiles').select('coins').eq('id', transaction.user_id).single();
          if (profile) await supabase.from('profiles').update({ coins: (profile as any).coins + coinsToAdd }).eq('id', transaction.user_id);
        }
      } else if (event === 'payment.failed' || status === 'failed') { newStatus = 'failed'; }
      await supabase.from('transactions').update({ status: newStatus, metadata: { ...(transaction.metadata as any), webhook_event: event, webhook_received_at: new Date().toISOString(), mpesa_receipt: data?.mpesaReceiptNumber } }).eq('id', transaction.id);
    }
    return new Response(JSON.stringify({ received: true, processed: !!transaction }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('mpesa-webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
