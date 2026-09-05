import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_AMOUNTS: Record<string, Record<string, { amountInSubunit: number; currency: string }>> = {
  basic: {
    KE: { amountInSubunit: 50000, currency: 'KES' }, // 500 KES in cents
    NG: { amountInSubunit: 300000, currency: 'NGN' }, // 3,000 NGN in kobo
    DEFAULT: { amountInSubunit: 500, currency: 'USD' }, // $5.00
  },
  pro: {
    KE: { amountInSubunit: 100000, currency: 'KES' },
    NG: { amountInSubunit: 600000, currency: 'NGN' },
    DEFAULT: { amountInSubunit: 1000, currency: 'USD' },
  },
  vip: {
    KE: { amountInSubunit: 200000, currency: 'KES' },
    NG: { amountInSubunit: 1200000, currency: 'NGN' },
    DEFAULT: { amountInSubunit: 2000, currency: 'USD' },
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan = 'basic', country = 'DEFAULT', callback_url } = await req.json();

    const planConfig = PLAN_AMOUNTS[plan]?.[country] || PLAN_AMOUNTS[plan]?.DEFAULT || { amountInSubunit: 500, currency: 'USD' };

    if (!PAYSTACK_SECRET_KEY) {
      console.warn('[paystack-initialize] PAYSTACK_SECRET_KEY not set.');
      return new Response(JSON.stringify({
        authorization_url: `${callback_url || 'https://predictpro.guru/shop'}?paystack=simulated&reference=mock_${Date.now()}`,
        reference: `mock_${Date.now()}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reference = `pp_${plan}_${user.id.slice(0, 8)}_${Date.now()}`;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: planConfig.amountInSubunit,
        currency: planConfig.currency,
        reference,
        callback_url,
        metadata: {
          user_id: user.id,
          plan,
          country,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return new Response(JSON.stringify({ error: data.message || 'Failed to initialize Paystack checkout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
