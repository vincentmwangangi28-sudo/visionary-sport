import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTS_CONFIG = [
  { 
    sport: 'football', 
    leagues: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Kenya Premier League', 'MLS'],
    count: 8
  },
  { 
    sport: 'basketball', 
    leagues: ['NBA', 'EuroLeague', 'NCAA'],
    count: 4
  },
  { 
    sport: 'tennis', 
    leagues: ['ATP Tour', 'WTA Tour', 'Grand Slam'],
    count: 2
  }
];

async function callAIWithRetry(lovableApiKey: string, messages: unknown[], maxRetries = 3): Promise<unknown | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }

      if (response.status === 429 || response.status === 402) {
        const delay = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
        console.log(`AI rate limited (${response.status}), retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      console.error(`AI API error: ${response.status}`);
      return null;
    } catch (e) {
      console.error(`AI call error attempt ${attempt + 1}:`, e);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let totalPredictions = 0;
    const errors: string[] = [];

    for (const sportConfig of SPORTS_CONFIG) {
      for (let i = 0; i < sportConfig.count; i++) {
        const league = sportConfig.leagues[i % sportConfig.leagues.length];
        
        try {
          const prompt = `Generate a realistic ${sportConfig.sport} match prediction for ${league}.
          
Return a JSON object with:
{
  "homeTeam": "Team A name",
  "awayTeam": "Team B name", 
  "prediction": "Home Win" or "Away Win" or "Draw" or "Over 2.5" or specific prediction,
  "confidence": number between 60-95,
  "reasoning": "Detailed 2-3 sentence analysis",
  "matchDate": "ISO date string for a match in next 3 days",
  "isUpsetAlert": boolean if underdog is predicted to win,
  "oddsValue": estimated decimal odds between 1.5-5.0
}

Make it realistic with actual team naming conventions for ${sportConfig.sport}.`;

          const content = await callAIWithRetry(lovableApiKey, [
            { role: 'system', content: 'You are a sports prediction AI. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ]);

          if (!content) {
            errors.push(`${sportConfig.sport} prediction ${i}: AI unavailable after retries`);
            continue;
          }

          const jsonMatch = String(content).match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          
          const prediction = JSON.parse(jsonMatch[0]);
          const matchId = `${sportConfig.sport}_${Date.now()}_${i}`;
          
          // Check for duplicates
          const { data: existing } = await supabase
            .from('predictions')
            .select('id')
            .eq('home_team', prediction.homeTeam)
            .eq('away_team', prediction.awayTeam)
            .gte('match_date', new Date().toISOString().split('T')[0])
            .single();

          if (existing) continue;

          const { error: insertError } = await supabase
            .from('predictions')
            .insert({
              match_id: matchId,
              home_team: prediction.homeTeam,
              away_team: prediction.awayTeam,
              league: league,
              sport: sportConfig.sport,
              prediction: prediction.prediction,
              confidence: Math.min(95, Math.max(60, prediction.confidence)),
              reasoning: prediction.reasoning,
              match_date: prediction.matchDate || new Date(Date.now() + 86400000).toISOString(),
              is_upset_alert: prediction.isUpsetAlert || false,
              odds_value: prediction.oddsValue || null,
              is_premium: prediction.confidence > 85,
              ai_model: 'google/gemini-2.5-flash'
            });

          if (insertError) {
            errors.push(`Insert error for ${sportConfig.sport}: ${insertError.message}`);
          } else {
            totalPredictions++;
          }

          // Rate limiting delay
          await new Promise(r => setTimeout(r, 2000));
          
        } catch (e: unknown) {
          errors.push(`${sportConfig.sport} prediction ${i}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`Generated ${totalPredictions} multi-sport predictions`);

    return new Response(JSON.stringify({
      success: true,
      count: totalPredictions,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Multi-sport predictions error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
