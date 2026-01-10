import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Cron: Starting daily predictions generation...');
  
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FOOTBALL_DATA_TOKEN = Deno.env.get('FOOTBALL_DATA_TOKEN') || Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let predictionsGenerated = 0;
    let matchesProcessed = 0;
    const errors: string[] = [];

    // Use Football-Data.org API (free tier: 10 requests/minute)
    if (FOOTBALL_DATA_TOKEN) {
      console.log('Using Football-Data.org API...');
      
      try {
        // Fetch scheduled matches for upcoming days
        const response = await fetch(
          `https://api.football-data.org/v4/matches?status=SCHEDULED`,
          {
            headers: {
              'X-Auth-Token': FOOTBALL_DATA_TOKEN,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Football-Data API error: ${response.status} - ${errorText}`);
          errors.push(`API error: ${response.status}`);
        } else {
          const data = await response.json();
          const matches = data.matches || [];
          
          console.log(`Found ${matches.length} scheduled matches`);
          
          // Process up to 10 matches to avoid rate limits
          for (const match of matches.slice(0, 10)) {
            matchesProcessed++;
            const matchId = `fd-${match.id}`;
            
            // Check if prediction already exists
            const { data: existing } = await supabase
              .from('predictions')
              .select('id')
              .eq('match_id', matchId)
              .maybeSingle();

            if (existing) {
              console.log(`Prediction already exists for ${matchId}`);
              continue;
            }

            // Generate AI prediction using Lovable AI
            let prediction = 'Home Win';
            let confidence = 65;
            let reasoning = 'Based on historical performance and current form.';

            if (LOVABLE_API_KEY) {
              try {
                const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      {
                        role: 'system',
                        content: 'You are a sports prediction AI. Analyze the match and provide a prediction. Respond ONLY with valid JSON in this exact format: {"prediction": "Home Win" or "Away Win" or "Draw", "confidence": number between 50-95, "reasoning": "brief explanation under 100 words"}'
                      },
                      {
                        role: 'user',
                        content: `Predict the outcome of this ${match.competition?.name || 'football'} match: ${match.homeTeam?.name} vs ${match.awayTeam?.name} on ${match.utcDate}`
                      }
                    ],
                  }),
                });

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  const content = aiData.choices?.[0]?.message?.content || '';
                  
                  try {
                    // Clean the response - remove markdown code blocks if present
                    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
                    const parsed = JSON.parse(cleanContent);
                    prediction = parsed.prediction || prediction;
                    confidence = parsed.confidence || confidence;
                    reasoning = parsed.reasoning || reasoning;
                  } catch {
                    console.log('Could not parse AI response, using defaults');
                  }
                }
              } catch (aiError) {
                console.error('AI prediction error:', aiError);
              }
            }

            // Insert prediction
            const { error: insertError } = await supabase.from('predictions').insert({
              match_id: matchId,
              home_team: match.homeTeam?.name || 'Home Team',
              away_team: match.awayTeam?.name || 'Away Team',
              league: match.competition?.name || 'Football',
              match_date: match.utcDate,
              prediction: prediction,
              confidence: confidence,
              reasoning: reasoning,
              ai_model: 'google/gemini-2.5-flash',
              is_premium: confidence >= 80,
            });

            if (insertError) {
              console.error('Error inserting prediction:', insertError);
              errors.push(`Insert error: ${insertError.message}`);
            } else {
              predictionsGenerated++;
              console.log(`Generated prediction for ${match.homeTeam?.name} vs ${match.awayTeam?.name}`);
            }

            // Small delay to avoid AI rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        errors.push(`Fetch error: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`);
      }
    } else {
      console.log('No Football Data API token configured');
      errors.push('No API token configured');
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      matches_processed: matchesProcessed,
      predictions_generated: predictionsGenerated,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Cron: Daily predictions completed', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cron error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Cron job failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
