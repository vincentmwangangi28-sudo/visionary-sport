import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const payload = await req.json();
    console.log('Received M-Pesa webhook:', JSON.stringify(payload));

    const { event, data } = payload;
    const { transactionId, checkoutRequestID, status, amount } = data || {};

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
            mpesa_receipt: data?.mpesaReceiptNumber,
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
