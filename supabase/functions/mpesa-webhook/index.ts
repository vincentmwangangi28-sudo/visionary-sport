import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature',
};

// Helper function to compare signatures securely (constant-time comparison)
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LIPANA_WEBHOOK_SECRET = Deno.env.get('LIPANA_WEBHOOK_SECRET');
    
    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get('x-lipana-signature');
    
    if (!LIPANA_WEBHOOK_SECRET) {
      console.error('LIPANA_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!signature) {
      console.error('Missing x-lipana-signature header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Compute expected signature
    const encoder = new TextEncoder();
    const data = encoder.encode(rawBody + LIPANA_WEBHOOK_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const expectedSignature = bufferToHex(hashBuffer);
    
    // Securely compare signatures
    if (!secureCompare(signature.toLowerCase(), expectedSignature.toLowerCase())) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Webhook signature verified successfully');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const payload = JSON.parse(rawBody);
    console.log('Received M-Pesa webhook:', JSON.stringify(payload));

    const { event, data: payloadData } = payload;
    const { transactionId, checkoutRequestID, status, amount } = payloadData || {};

    if (!transactionId && !checkoutRequestID) {
      console.log('No transaction identifier in webhook payload');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the pending transaction
    let query = supabase.from('transactions').select('*');
    
    if (checkoutRequestID) {
      query = query.eq('metadata->checkout_request_id', checkoutRequestID);
    } else if (transactionId) {
      query = query.eq('metadata->transaction_id', transactionId);
    }
    
    const { data: transactions, error: findError } = await query.eq('status', 'pending');

    if (findError) {
      console.error('Error finding transaction:', findError);
    }

    const transaction = transactions?.[0];

    if (transaction) {
      let newStatus = 'pending';
      
      if (event === 'payment.success' || status === 'success') {
        newStatus = 'completed';
        
        // Update user based on payment purpose
        if (transaction.type === 'premium_subscription') {
          // Grant premium role
          const { error: roleError } = await supabase.from('user_roles').upsert({
            user_id: transaction.user_id,
            role: 'premium',
          }, { onConflict: 'user_id,role' });
          
          if (roleError) {
            console.error('Error granting premium role:', roleError);
          } else {
            console.log(`Premium role granted to user ${transaction.user_id}`);
          }
        } else if (transaction.type === 'coin_purchase') {
          // Add coins based on amount (1 KES = 1 coin)
          const coinsToAdd = amount || transaction.amount;
          
          // Get current coins and add
          const { data: profile } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', transaction.user_id)
            .single();
          
          if (profile) {
            await supabase.from('profiles')
              .update({ coins: profile.coins + coinsToAdd })
              .eq('id', transaction.user_id);
          }
          console.log(`Added ${coinsToAdd} coins to user ${transaction.user_id}`);
        }
      } else if (event === 'payment.failed' || status === 'failed') {
        newStatus = 'failed';
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: newStatus,
          metadata: {
            ...transaction.metadata,
            webhook_event: event,
            webhook_received_at: new Date().toISOString(),
            mpesa_receipt: payloadData?.mpesaReceiptNumber,
          },
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      } else {
        console.log(`Transaction ${transaction.id} updated to ${newStatus}`);
      }
    } else {
      console.log('No matching pending transaction found for webhook');
    }

    return new Response(JSON.stringify({ received: true, processed: !!transaction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mpesa-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
