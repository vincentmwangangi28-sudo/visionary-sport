import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { phone, amount, plan = 'pro' } = await req.json();

    if (!phone || !amount) {
      return new Response(JSON.stringify({ success: false, error: 'Phone and amount required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const consumerKey = Deno.env.get('DARAJA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('DARAJA_CONSUMER_SECRET');
    const passkey = Deno.env.get('DARAJA_PASSKEY');
    const shortcode = Deno.env.get('DARAJA_SHORTCODE') || '174379';

    // Format phone to 254...
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    else if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;

    if (!consumerKey || !consumerSecret || !passkey) {
      // Graceful fallback to sandbox response if live Safaricom keys are not set yet
      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        message: 'M-Pesa STK push simulation dispatched to ' + cleanPhone,
        checkoutRequestId: `ws_CO_${Date.now()}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get OAuth token from Safaricom
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${authString}` },
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Could not acquire Daraja access token');
    }

    // 2. Generate Timestamp and Password
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(amount)),
        PartyA: cleanPhone,
        PartyB: shortcode,
        PhoneNumber: cleanPhone,
        CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-webhook`,
        AccountReference: `PredictPro_${plan}`,
        TransactionDesc: `Subscription payment for ${plan}`,
      }),
    });

    const stkData = await stkRes.json();

    return new Response(JSON.stringify({
      success: stkData.ResponseCode === '0',
      data: stkData,
      message: stkData.ResponseDescription || 'STK Push sent to device',
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
