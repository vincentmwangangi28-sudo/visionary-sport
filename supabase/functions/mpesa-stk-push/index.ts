import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = 3;        // max requests
const RATE_WINDOW = 60_000;  // per 60 seconds

interface STKPushRequest {
  phone: string;
  amount: number;
  purpose: 'premium_subscription' | 'coin_purchase' | 'tip';
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LIPANA_SECRET_KEY = Deno.env.get('LIPANA_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LIPANA_SECRET_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Rate-limit per user (or IP if unauthenticated)
    const rateLimitKey = userId ?? (req.headers.get('x-forwarded-for') ?? 'anon');
    const windowStart = new Date(Date.now() - RATE_WINDOW).toISOString();
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq(userId ? 'user_id' : 'metadata->>ip', userId ?? rateLimitKey)
      .gte('created_at', windowStart)
      .eq('payment_method', 'mpesa');

    if ((count ?? 0) >= RATE_LIMIT) {
      return new Response(JSON.stringify({ success: false, error: 'Too many requests. Please wait a minute before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: STKPushRequest = await req.json();
    const { phone, amount, purpose, metadata } = body;

    if (!phone || !amount || !purpose) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: phone, amount, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (amount < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Minimum amount is KES 10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '254');
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    const lipanaResponse = await fetch('https://api.lipana.dev/v1/api/transactions/push-stk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': LIPANA_SECRET_KEY },
      body: JSON.stringify({ phone: formattedPhone, amount }),
    });

    const lipanaData = await lipanaResponse.json();

    if (!lipanaResponse.ok || !lipanaData.success) {
      return new Response(JSON.stringify({ success: false, error: lipanaData.message || 'Failed to initiate payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let insertedId: string | null = null;
    if (userId) {
      const { data: tx, error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: purpose,
        amount,
        status: 'pending',
        payment_method: 'mpesa',
        metadata: {
          transaction_id: lipanaData.data?.transactionId,
          checkout_request_id: lipanaData.data?.checkoutRequestID,
          phone: formattedPhone,
          ip: req.headers.get('x-forwarded-for'),
          ...metadata,
        },
      }).select('id').single();

      if (txError) console.error('Error creating transaction:', txError);
      else insertedId = tx?.id ?? null;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'STK push initiated. Check your phone to complete the payment.',
      data: {
        transactionId: insertedId ?? lipanaData.data?.transactionId,
        checkoutRequestID: lipanaData.data?.checkoutRequestID,
        status: 'pending',
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in mpesa-stk-push:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
