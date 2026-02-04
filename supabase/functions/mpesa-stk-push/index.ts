import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid payment purposes
const VALID_PURPOSES = ['premium_subscription', 'coin_purchase', 'tip'] as const;
type PaymentPurpose = typeof VALID_PURPOSES[number];

// Payment limits
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 100000;
const MAX_METADATA_FIELDS = 10;

// Phone number validation regex (Kenyan format)
const PHONE_REGEX = /^(?:\+?254|0)?[17]\d{8}$/;

interface STKPushRequest {
  phone: string;
  amount: number;
  purpose: string;
  metadata?: Record<string, unknown>;
}

// Sanitize metadata to prevent injection
function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!metadata) return undefined;
  
  const sanitized: Record<string, string> = {};
  const keys = Object.keys(metadata);
  
  // Limit number of fields
  if (keys.length > MAX_METADATA_FIELDS) {
    throw new Error(`Too many metadata fields. Maximum is ${MAX_METADATA_FIELDS}`);
  }
  
  for (const key of keys) {
    // Only allow alphanumeric keys
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      continue; // Skip invalid keys
    }
    
    const value = metadata[key];
    // Only allow primitive values, convert to string
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Limit value length
      const strValue = String(value).slice(0, 500);
      sanitized[key] = strValue;
    }
  }
  
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
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

    // Validate required fields
    if (!phone || amount === undefined || amount === null || !purpose) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: phone, amount, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount must be a valid number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum amount
    if (amount < MIN_AMOUNT) {
      return new Response(
        JSON.stringify({ success: false, error: `Minimum amount is KES ${MIN_AMOUNT}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate maximum amount
    if (amount > MAX_AMOUNT) {
      return new Response(
        JSON.stringify({ success: false, error: `Maximum amount is KES ${MAX_AMOUNT.toLocaleString()}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate purpose
    if (!VALID_PURPOSES.includes(purpose as PaymentPurpose)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid purpose. Must be one of: ${VALID_PURPOSES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format. Use Kenyan format (e.g., 0712345678 or 254712345678)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize metadata
    let sanitizedMetadata: Record<string, string> | undefined;
    try {
      sanitizedMetadata = sanitizeMetadata(metadata);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: (err as Error).message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (ensure it starts with 254)
    let formattedPhone = cleanPhone.replace(/^0/, '254');
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

    const lipanaData = await lipanaResponse.json();
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
          ...sanitizedMetadata,
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
