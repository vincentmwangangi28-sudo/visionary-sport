import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  // Verify Stripe signature
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      const encoder = new TextEncoder();
      const parts = sig.split(',');
      const timestamp = parts.find(p => p.startsWith('t='))?.slice(2) ?? '';
      const expectedSig = parts.find(p => p.startsWith('v1='))?.slice(3) ?? '';
      const payload = `${timestamp}.${body}`;
      const key = await crypto.subtle.importKey('raw', encoder.encode(STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
      const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (computed !== expectedSig) return new Response('Invalid signature', { status: 400 });
    } catch { return new Response('Signature error', { status: 400 }); }
  }

  const event = JSON.parse(body);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan ?? 'pro';

    if (userId) {
      // Update transaction to completed
      await supabase.from('transactions').update({ status: 'completed', metadata: { stripe_session_id: session.id, plan, payment_intent: session.payment_intent } })
        .eq('payment_method', 'stripe').contains('metadata', { stripe_session_id: session.id });

      // Cancel existing subscription
      await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');

      // Activate new subscription
      const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 1);
      await supabase.from('subscriptions').insert({
        user_id: userId, plan, status: 'active',
        expires_at: expiresAt.toISOString(),
        price_kes: plan === 'basic' ? 299 : plan === 'pro' ? 599 : 999,
        metadata: { stripe_session_id: session.id, payment_intent: session.payment_intent },
      });

      // Notify user
      await supabase.from('notifications').insert({
        user_id: userId, type: 'subscription_activated',
        message: `Your ${plan.toUpperCase()} subscription has been activated via card payment! Enjoy premium predictions.`,
        metadata: { plan, stripe_session_id: session.id },
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    const email = pi.receipt_email;
    if (email) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (profile) {
        await supabase.from('notifications').insert({
          user_id: profile.id, type: 'payment_failed',
          message: 'Your card payment failed. Please check your card details and try again.',
          metadata: { payment_intent: pi.id },
        });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
