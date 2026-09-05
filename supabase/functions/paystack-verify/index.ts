import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ success: false, error: 'Reference required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If simulated mock reference in demo mode
    if (reference.startsWith('mock_')) {
      return new Response(JSON.stringify({
        success: true,
        status: 'success',
        simulated: true,
        message: 'Sandbox transaction verified',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Payment gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await res.json();
    if (!res.ok || data.data?.status !== 'success') {
      return new Response(JSON.stringify({
        success: false,
        status: data.data?.status || 'failed',
        error: data.message || 'Transaction verification unsuccessful',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tx = data.data;
    const userId = tx.metadata?.user_id;
    const plan = tx.metadata?.plan || 'pro';

    if (userId) {
      // Calculate expiration: 30 days
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
        amount: tx.amount / 100,
        currency: tx.currency,
        payment_method: 'paystack',
        status: 'completed',
        reference: tx.reference,
        metadata: tx,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'success',
      plan,
      amount: tx.amount / 100,
      currency: tx.currency,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
