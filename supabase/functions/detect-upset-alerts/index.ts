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

    // Get predictions without upset analysis
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .is('is_upset_alert', null)
      .gte('match_date', new Date().toISOString())
      .limit(20);

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let upsetCount = 0;

    for (const prediction of predictions) {
      try {
        const prompt = `Analyze if this prediction is an upset alert:
Match: ${prediction.home_team} vs ${prediction.away_team}
League: ${prediction.league}
Prediction: ${prediction.prediction}
Confidence: ${prediction.confidence}%

An upset is when the predicted outcome favors a team that would typically be considered the underdog.

Return JSON: {"isUpset": boolean, "upsetReason": "brief explanation if upset", "estimatedOdds": number between 1.5-6.0}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You are a sports betting analyst. Return only valid JSON.' },
              { role: 'user', content: prompt }
            ]
          })
        });

        if (!response.ok) continue;

        const aiData = await response.json();
        const content = aiData.choices[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const analysis = JSON.parse(jsonMatch[0]);

        // Update prediction with upset info
        await supabase
          .from('predictions')
          .update({
            is_upset_alert: analysis.isUpset || false,
            odds_value: analysis.estimatedOdds || null,
            reasoning: analysis.isUpset 
              ? `⚠️ UPSET ALERT: ${analysis.upsetReason}\n\n${prediction.reasoning}`
              : prediction.reasoning
          })
          .eq('id', prediction.id);

        if (analysis.isUpset) upsetCount++;

        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.error(`Upset analysis error for ${prediction.id}:`, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: upsetCount,
      analyzed: predictions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Detect upset alerts error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
