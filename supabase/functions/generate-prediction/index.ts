import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert sports prediction AI. Analyze match data and provide predictions with reasoning.
Always respond in JSON format with: prediction (e.g., "Home Win", "Away Win", "Draw"), confidence (0-100), and reasoning (detailed analysis).`;

    const userPrompt = `Analyze this match:
Home Team: ${matchData.homeTeam}
Away Team: ${matchData.awayTeam}
League: ${matchData.league}
Date: ${matchData.matchDate}

Provide prediction with confidence and reasoning.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "make_prediction",
              description: "Return match prediction with analysis",
              parameters: {
                type: "object",
                properties: {
                  prediction: { 
                    type: "string",
                    enum: ["Home Win", "Away Win", "Draw"]
                  },
                  confidence: { 
                    type: "number",
                    minimum: 0,
                    maximum: 100
                  },
                  reasoning: { type: "string" }
                },
                required: ["prediction", "confidence", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "make_prediction" } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", response.status, error);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No prediction generated");
    }

    const predictionData = JSON.parse(toolCall.function.arguments);

    // Save prediction to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const matchId = `${matchData.homeTeam}-${matchData.awayTeam}-${matchData.matchDate}`;

    const { data: savedPrediction, error: dbError } = await supabase
      .from('predictions')
      .insert({
        match_id: matchId,
        home_team: matchData.homeTeam,
        away_team: matchData.awayTeam,
        league: matchData.league,
        match_date: matchData.matchDate,
        prediction: predictionData.prediction,
        confidence: predictionData.confidence,
        reasoning: predictionData.reasoning,
        is_premium: matchData.isPremium || false
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    // Get authenticated user if available
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Save to predictions_history if user is authenticated
    if (userId) {
      await supabase.from('predictions_history').insert({
        user_id: userId,
        match_id: matchId,
        home_team: matchData.homeTeam,
        away_team: matchData.awayTeam,
        competition: matchData.league,
        match_date: matchData.matchDate,
        prediction: predictionData.prediction,
        confidence: predictionData.confidence
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      prediction: savedPrediction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
