import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const REFERRAL_COINS = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { referralCode, userId } = await req.json();
    if (!referralCode || !userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing referralCode or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find referrer
    const { data: codeData, error: codeErr } = await supabase
      .from('referral_codes').select('user_id').eq('code', referralCode.toUpperCase()).single();
    if (codeErr || !codeData) return new Response(JSON.stringify({ success: false, error: 'Invalid code' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (codeData.user_id === userId) return new Response(JSON.stringify({ success: false, error: 'Cannot self-refer' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Idempotency check
    const { data: existing } = await supabase.from('referrals').select('id').eq('referred_id', userId).single();
    if (existing) return new Response(JSON.stringify({ success: false, error: 'Referral already applied' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Insert referral record
    await supabase.from('referrals').insert({
      referrer_id: codeData.user_id, referred_id: userId,
      referral_code: referralCode.toUpperCase(), status: 'completed', coins_earned: REFERRAL_COINS,
    });

    // Increment uses_count
    await supabase.rpc('increment_referral_uses', { code_val: referralCode.toUpperCase() });

    // Credit coins to both parties
    await supabase.rpc('add_coins', { user_id_val: codeData.user_id, amount_val: REFERRAL_COINS });
    await supabase.rpc('add_coins', { user_id_val: userId, amount_val: REFERRAL_COINS });

    return new Response(JSON.stringify({ success: true, coinsAwarded: REFERRAL_COINS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('apply-referral-on-signup error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
