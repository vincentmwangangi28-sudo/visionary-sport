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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { riskLevel = 'medium', slipSize = 3, userId } = await req.json();

    // Get high-confidence predictions for today/tomorrow
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .gte('match_date', new Date().toISOString())
      .lte('match_date', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
      .order('confidence', { ascending: false })
      .limit(20);

    if (!predictions || predictions.length < slipSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not enough predictions available'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter by risk level
    let minConfidence = 70;
    let maxConfidence = 95;
    
    if (riskLevel === 'low') {
      minConfidence = 80;
    } else if (riskLevel === 'high') {
      minConfidence = 60;
      maxConfidence = 85;
    }

    const eligible = predictions.filter(
      p => p.confidence >= minConfidence && p.confidence <= maxConfidence
    );

    if (eligible.length < slipSize) {
      return new Response(JSON.stringify({
        success: false,
        error: `Not enough ${riskLevel} risk predictions available`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AI-powered slip optimization
    const prompt = `From these predictions, select the best ${slipSize} for a ${riskLevel} risk accumulator bet:

${eligible.slice(0, 10).map((p, i) => `${i + 1}. ${p.home_team} vs ${p.away_team} - ${p.prediction} (${p.confidence}% confidence, ${p.league})`).join('\n')}

Consider:
- Spread across different leagues for diversification
- Avoid same-league conflicts
- Optimize for combined probability

Return JSON:
{
  "selectedIndices": [array of 1-based indices],
  "reasoning": "Brief explanation",
  "combinedConfidence": estimated combined win probability (0-100),
  "suggestedStake": suggested stake amount in percentage of bankroll (1-10)
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a sports betting strategist. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await response.json();
    const content = aiData.choices[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Build the slip
    const selectedPredictions = analysis.selectedIndices.map((idx: number) => eligible[idx - 1]).filter(Boolean);
    
    // Calculate combined odds (simplified)
    const totalOdds = selectedPredictions.reduce((acc: number, p: any) => {
      const impliedOdds = 100 / p.confidence;
      return acc * Math.max(1.3, impliedOdds);
    }, 1);

    const slip = {
      predictions: selectedPredictions.map((p: any) => ({
        matchId: p.match_id,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        prediction: p.prediction,
        confidence: p.confidence,
        league: p.league,
        matchDate: p.match_date,
        sport: p.sport
      })),
      totalOdds: Math.round(totalOdds * 100) / 100,
      combinedConfidence: analysis.combinedConfidence,
      stakePercentage: analysis.suggestedStake,
      riskLevel,
      reasoning: analysis.reasoning
    };

    // Save slip if user is authenticated
    if (userId) {
      await supabase.from('smart_slips').insert({
        user_id: userId,
        predictions: slip.predictions,
        total_odds: slip.totalOdds,
        combined_confidence: slip.combinedConfidence,
        stake_suggestion: slip.stakePercentage,
        potential_return: slip.totalOdds * 100, // Based on 100 unit stake
        is_public: false
      });
    }

    return new Response(JSON.stringify({
      success: true,
      slip
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Smart slip builder error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
