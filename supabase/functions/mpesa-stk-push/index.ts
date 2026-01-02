import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  phone: string;
  amount: number;
  purpose: 'premium_subscription' | 'coin_purchase' | 'tip';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIPANA_SECRET_KEY = Deno.env.get('LIPANA_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LIPANA_SECRET_KEY) {
      console.error('LIPANA_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body: STKPushRequest = await req.json();
    const { phone, amount, purpose, metadata } = body;

    // Validate inputs
    if (!phone || !amount || !purpose) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: phone, amount, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Minimum amount is KES 10
    if (amount < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum amount is KES 10' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '254');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`Initiating STK push for ${formattedPhone}, amount: ${amount}, purpose: ${purpose}`);

    // Call Lipana STK Push API
    const lipanaResponse = await fetch('https://api.lipana.dev/v1/api/transactions/push-stk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIPANA_SECRET_KEY,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        amount: amount,
      }),
    });

    // Check if response is JSON before parsing
    const contentType = lipanaResponse.headers.get('content-type') || '';
    const responseText = await lipanaResponse.text();
    
    console.log('Lipana response status:', lipanaResponse.status);
    console.log('Lipana content-type:', contentType);
    console.log('Lipana response body:', responseText.substring(0, 500));

    // Handle non-JSON responses (API errors, HTML pages, etc.)
    if (!contentType.includes('application/json')) {
      console.error('Lipana API returned non-JSON response:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment service temporarily unavailable. Please try again later.',
          details: `API returned ${lipanaResponse.status}: ${contentType}` 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let lipanaData;
    try {
      lipanaData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Lipana response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from payment service' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lipana response:', JSON.stringify(lipanaData));

    if (!lipanaResponse.ok || !lipanaData.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: lipanaData.message || 'Failed to initiate payment',
          details: lipanaData 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending transaction record
    if (userId) {
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: purpose,
        amount: amount,
        status: 'pending',
        payment_method: 'mpesa',
        metadata: {
          transaction_id: lipanaData.data?.transactionId,
          checkout_request_id: lipanaData.data?.checkoutRequestID,
          phone: formattedPhone,
          ...metadata,
        },
      });

      if (txError) {
        console.error('Error creating transaction record:', txError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK push initiated. Check your phone to complete the payment.',
        data: {
          transactionId: lipanaData.data?.transactionId,
          checkoutRequestID: lipanaData.data?.checkoutRequestID,
          status: 'pending',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mpesa-stk-push:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
