import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

async function fetchMatchContext(homeTeam: string, awayTeam: string, league: string) {
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  if (!RAPIDAPI_KEY) return null;

  const headers = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' };

  try {
    // Fetch team IDs
    const [homeRes, awayRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(homeTeam)}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(awayTeam)}`, { headers }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    const homeId = homeData?.response?.[0]?.team?.id;
    const awayId = awayData?.response?.[0]?.team?.id;
    if (!homeId || !awayId) return null;

    const season = new Date().getFullYear();
    // Fetch form, standings, H2H in parallel
    const [formHomeRes, formAwayRes, h2hRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${homeId}&last=5&season=${season}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${awayId}&last=5&season=${season}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`, { headers }),
    ]);
    const [formHome, formAway, h2h] = await Promise.all([formHomeRes.json(), formAwayRes.json(), h2hRes.json()]);

    const getForm = (fixtures: { goals: { home: number; away: number }; teams: { home: { id: number; winner: boolean }; away: { id: number; winner: boolean } } }[], teamId: number) =>
      fixtures?.slice(0, 5).map(f => {
        const isHome = f.teams.home.id === teamId;
        if (isHome ? f.teams.home.winner : f.teams.away.winner) return 'W';
        if (!f.teams.home.winner && !f.teams.away.winner) return 'D';
        return 'L';
      }).join('') || 'N/A';

    return {
      homeForm: getForm(formHome?.response || [], homeId),
      awayForm: getForm(formAway?.response || [], awayId),
      h2hHistory: (h2h?.response || []).slice(0, 5).map((f: { teams: { home: { name: string; winner: boolean }; away: { name: string; winner: boolean } }; goals: { home: number; away: number } }) =>
        `${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name}`
      ).join(', ') || 'No recent H2H',
    };
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { matchData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Enrich with real match context
    const context = await fetchMatchContext(matchData.homeTeam, matchData.awayTeam, matchData.league);

    const systemPrompt = `You are an expert sports prediction AI. Analyze match data including team form, head-to-head history, and league context to provide accurate predictions. Always respond in JSON format.`;

    const userPrompt = `Analyze this match:
Home Team: ${matchData.homeTeam} | Recent form: ${context?.homeForm || 'Unknown'}
Away Team: ${matchData.awayTeam} | Recent form: ${context?.awayForm || 'Unknown'}
League: ${matchData.league}
Date: ${matchData.matchDate}
${context ? `Head-to-Head (last 5): ${context.h2hHistory}` : ''}

Provide: prediction (Home Win/Away Win/Draw), confidence (0-100), detailed reasoning considering form and H2H.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        tools: [{
          type: 'function',
          function: {
            name: 'make_prediction',
            description: 'Return match prediction',
            parameters: {
              type: 'object',
              properties: {
                prediction: { type: 'string', enum: ['Home Win', 'Away Win', 'Draw'] },
                confidence: { type: 'number', minimum: 0, maximum: 100 },
                reasoning: { type: 'string' },
              },
              required: ['prediction', 'confidence', 'reasoning'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'make_prediction' } },
      }),
    });

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!result) throw new Error('No prediction returned');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: prediction, error } = await supabase.from('predictions').insert({
      home_team: matchData.homeTeam, away_team: matchData.awayTeam,
      league: matchData.league, match_date: matchData.matchDate,
      prediction: result.prediction, confidence: result.confidence,
      reasoning: result.reasoning, is_premium: matchData.isPremium ?? false,
      ai_model: 'gemini-2.5-flash',
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, prediction }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('generate-prediction error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500, headers: corsHeaders });
  }
});
