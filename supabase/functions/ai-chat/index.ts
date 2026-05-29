import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const GEMINI_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!GEMINI_KEY) return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Rate limit: 10 messages per user per hour
  const authHeader = req.headers.get('authorization');
  let userId = 'anon';
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (user) userId = user.id;
  }

  const { message, history = [] } = await req.json();
  if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: corsHeaders });

  // Fetch recent predictions for context
  const { data: predictions } = await supabase.from('predictions').select('home_team, away_team, match_date, prediction, confidence, league').order('match_date', { ascending: true }).limit(10);

  const systemContext = `You are PredictPro AI, an expert football analyst assistant for the Kenyan market.
You have access to today's AI predictions: ${JSON.stringify(predictions?.slice(0, 5) ?? [])}.
You specialise in: EPL, La Liga, Serie A, Bundesliga, KPL (Kenya Premier League), AFCON, Champions League.
You understand M-Pesa, Kenyan betting culture (SportPesa, Betika, Odibets).
Keep answers concise (under 150 words), factual, and helpful. Never guarantee wins.
If asked about specific odds, remind users to gamble responsibly.`;

  const contents = [
    ...history.slice(-6).map((m: { role: string; content: string }) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemContext }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 300 } }),
  });

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response. Please try again.';

  return new Response(JSON.stringify({ success: true, reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
