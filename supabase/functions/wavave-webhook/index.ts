import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const WAVAVE_WEBHOOK_SECRET = Deno.env.get('WAVAVE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!WAVAVE_WEBHOOK_SECRET) {
      return new Response('Webhook secret not configured', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse webhook payload
    const body = await req.json();
    const { reference, status, amount, transaction_id, message } = body;

    console.log('Wavave webhook received:', { reference, status, amount });

    if (!reference) {
      return new Response('Missing reference', { status: 400, headers: corsHeaders });
    }

    // Find transaction by Wavave reference
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, user_id, type, amount, metadata, status')
      .contains('metadata', { wavave_reference: reference })
      .single();

    if (txError || !tx) {
      console.warn('Transaction not found for reference:', reference);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle payment success
    if (status === 'success' || status === 'completed') {
      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          metadata: {
            ...tx.metadata as Record<string, unknown>,
            wavave_transaction_id: transaction_id,
            completed_at: new Date().toISOString(),
          },
        })
        .eq('id', tx.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Auto-activate subscription if this was a subscription payment
      if (tx.type === 'premium_subscription') {
        const plan = (tx.metadata as Record<string, string>)?.plan ?? 'pro';
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        await supabase.from('user_subscriptions').upsert(
          {
            user_id: tx.user_id,
            plan,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiryDate.toISOString(),
            auto_renew: true,
          },
          { onConflict: 'user_id' }
        );

        // Award coins on subscription
        await supabase
          .from('user_profiles')
          .update({ coins: tx.amount * 10 })
          .eq('user_id', tx.user_id);
      }

      // Handle coin purchase
      if (tx.type === 'coin_purchase') {
        const coinsToAdd = Math.round(amount / 10);
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('coins')
          .eq('user_id', tx.user_id)
          .single();

        await supabase
          .from('user_profiles')
          .update({ coins: (profile?.coins ?? 0) + coinsToAdd })
          .eq('user_id', tx.user_id);
      }

      console.log(`✅ Payment completed for user ${tx.user_id}, type: ${tx.type}`);
    }

    // Handle payment failure
    if (status === 'failed' || status === 'cancelled') {
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          metadata: {
            ...tx.metadata as Record<string, unknown>,
            error_message: message,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', tx.id);

      console.log(`❌ Payment failed for user ${tx.user_id}: ${message}`);
    }

    // Handle pending status
    if (status === 'pending') {
      await supabase
        .from('transactions')
        .update({
          status: 'pending',
          metadata: {
            ...tx.metadata as Record<string, unknown>,
            last_status_check: new Date().toISOString(),
          },
        })
        .eq('id', tx.id);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in wavave webhook:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
