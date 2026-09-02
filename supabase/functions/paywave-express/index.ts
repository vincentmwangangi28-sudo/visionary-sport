import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaywaveExpressRequest {
  phone: string;
  amount: number;
  purpose: 'premium_subscription' | 'coin_purchase' | 'tip';
  metadata?: Record<string, unknown>;
}

const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const WAVAVE_API_KEY = Deno.env.get('WAVAVE_API_KEY');
    const WAVAVE_MERCHANT_CODE = Deno.env.get('WAVAVE_MERCHANT_CODE');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!WAVAVE_API_KEY || !WAVAVE_MERCHANT_CODE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      .eq('payment_method', 'wavave');

    if ((count ?? 0) >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait a minute before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaywaveExpressRequest = await req.json();
    const { phone, amount, purpose, metadata } = body;

    if (!phone || !amount || !purpose) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: phone, amount, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum amount is KES 10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number
    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '254');
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

    // Generate unique reference
    const referenceCode = `PP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Call Wavave / PayWave Express API
    const wavaveResponse = await fetch('https://api.wavave.co.ke/v1/express-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAVAVE_API_KEY}`,
      },
      body: JSON.stringify({
        merchant_code: WAVAVE_MERCHANT_CODE,
        phone: formattedPhone,
        amount: Math.round(amount),
        reference: referenceCode,
        description: `PredictPro ${purpose.replace(/_/g, ' ')}`,
        callback_url: 'https://predictpro.guru/api/wavave-webhook',
      }),
    });

    const wavaveData = await wavaveResponse.json();

    if (!wavaveResponse.ok || !wavaveData.success) {
      console.error('Paywave/Wavave error:', wavaveData);
      return new Response(
        JSON.stringify({ success: false, error: wavaveData.message || 'Failed to initiate payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store transaction record
    let insertedId: string | null = null;
    if (userId) {
      const { data: tx, error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: purpose,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: 'wavave',
        metadata: {
          wavave_reference: referenceCode,
          wavave_transaction_id: wavaveData.data?.transaction_id,
          phone: formattedPhone,
          ip: req.headers.get('x-forwarded-for'),
          ...metadata,
        },
      }).select('id').single();

      if (txError) console.error('Error creating transaction:', txError);
      else insertedId = tx?.id ?? null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment initiated. You will receive a push notification on your phone.',
        data: {
          transactionId: insertedId,
          reference: referenceCode,
          status: 'pending',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paywave-express:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
