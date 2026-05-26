import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const PRIZES = [
  { type: 'coins', amount: 10, label: '10 Coins', color: '#FFD700' },
  { type: 'coins', amount: 25, label: '25 Coins', color: '#FFA500' },
  { type: 'coins', amount: 50, label: '50 Coins', color: '#FF6347' },
  { type: 'prediction', amount: 1, label: 'Free Prediction', color: '#9B59B6' },
  { type: 'nothing', amount: 0, label: 'Try Again', color: '#95A5A6' },
  { type: 'bonus', amount: 100, label: '100 Coins!', color: '#E74C3C' },
  { type: 'coins', amount: 15, label: '15 Coins', color: '#3498DB' },
  { type: 'nothing', amount: 0, label: 'Better Luck', color: '#7F8C8D' },
];
const WEIGHTS = [20, 15, 10, 5, 25, 2, 18, 5];

function selectPrize(): { prize: typeof PRIZES[0]; index: number } {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return { prize: PRIZES[i], index: i };
  }
  return { prize: PRIZES[0], index: 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  // Idempotency — one spin per day
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase.from('spin_wheel_entries').select('id')
    .eq('user_id', user.id).gte('spun_at', `${today}T00:00:00`).lte('spun_at', `${today}T23:59:59`).limit(1);

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ error: 'Already spun today', canSpin: false }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { prize, index } = selectPrize();

  // Record spin
  await supabase.from('spin_wheel_entries').insert({ user_id: user.id, prize_type: prize.type, prize_amount: prize.amount });

  // Award coins atomically using RPC
  if (prize.type === 'coins' || prize.type === 'bonus') {
    await supabase.rpc('add_coins', { user_id_val: user.id, amount_val: prize.amount });
  }

  return new Response(JSON.stringify({ success: true, prize, prizeIndex: index, canSpin: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
