import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter: max 5 predictions per user per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSecs: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSecs = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSecs };
  }

  entry.count++;
  return { allowed: true, retryAfterSecs: 0 };
}

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now >= val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    // Allow anon key calls (from cron/internal) without rate limiting
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const isInternalCall = token === anonKey || token === supabaseServiceKey;

    let userId: string | null = null;

    if (!isInternalCall) {
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;

      // Apply rate limiting for authenticated users
      const { allowed, retryAfterSecs } = checkRateLimit(userId);
      if (!allowed) {
        return new Response(JSON.stringify({
          error: 'Too many prediction requests. Please try again later.',
          retry_after: retryAfterSecs,
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSecs),
          },
        });
      }
    }

    const { matchData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Prediction service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      // Log details server-side only
      const errorBody = await response.text();
      console.error("AI gateway error:", response.status, errorBody);

      // Return generic error to client
      return new Response(JSON.stringify({
        error: 'Prediction generation failed. Please try again later.',
        code: 'AI_UNAVAILABLE',
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify({
        error: 'Prediction generation failed. Please try again.',
        code: 'AI_NO_RESULT',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const predictionData = JSON.parse(toolCall.function.arguments);

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
      return new Response(JSON.stringify({
        error: 'Failed to save prediction. Please try again.',
        code: 'DB_ERROR',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
