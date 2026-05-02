// Edge function: /predict and /predict/today
// - GET /predict?match_id=...  -> returns cached prediction or generates one
// - POST /predict { match_id, home_team, away_team, league, match_date, sport? } -> generates
// - GET /predict/today -> returns today's cached predictions (free fields only unless premium)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface MatchInput {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  sport?: string;
}

async function callAIWithRetry(payload: unknown, retries = 3): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 429 || res.status === 402) {
        const errBody = await res.text();
        throw new Error(`AI gateway ${res.status}: ${errBody}`);
      }
      if (!res.ok) throw new Error(`AI gateway error ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

async function generatePrediction(match: MatchInput) {
  const aiResp = await callAIWithRetry({
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "You are an expert sports analyst. Predict match outcomes with calibrated confidence. Respond strictly via the provided tool.",
      },
      {
        role: "user",
        content: `Predict this ${match.sport ?? "football"} match:\nLeague: ${match.league}\n${match.home_team} vs ${match.away_team}\nDate: ${match.match_date}\n\nProvide outcome (home_win/draw/away_win or similar), confidence (0-100), and concise reasoning.`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "submit_prediction",
          description: "Submit the match prediction.",
          parameters: {
            type: "object",
            properties: {
              prediction: { type: "string" },
              confidence: { type: "integer", minimum: 0, maximum: 100 },
              reasoning: { type: "string" },
              odds_value: { type: "number" },
            },
            required: ["prediction", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "submit_prediction" },
    },
  });

  const toolCall = aiResp?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return a structured prediction");
  const args = JSON.parse(toolCall.function.arguments);
  return {
    prediction: String(args.prediction),
    confidence: Math.round(Number(args.confidence)),
    reasoning: String(args.reasoning),
    odds_value: args.odds_value ? Number(args.odds_value) : null,
  };
}

function maskPremium(row: any, allowPremium: boolean) {
  if (!row?.is_premium || allowPremium) return row;
  const { reasoning: _r, prediction: _p, confidence: _c, ...rest } = row;
  return { ...rest, locked: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Function path is /functions/v1/predict[/today]
    const isToday = url.pathname.endsWith("/today");

    // Auth (optional): identify user for premium gating
    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | null = null;
    let allowPremium = false;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await userClient.auth.getClaims(token);
      userId = data?.claims?.sub ?? null;
      if (userId) {
        const { data: roles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        const r = (roles ?? []).map((x: any) => x.role);
        allowPremium = r.includes("admin") || r.includes("premium");
      }
    }

    // ----- /predict/today -----
    if (isToday && req.method === "GET") {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      const { data, error } = await admin
        .from("predictions")
        .select("*")
        .gte("match_date", start.toISOString())
        .lt("match_date", end.toISOString())
        .order("confidence", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []).map((r) => maskPremium(r, allowPremium));
      return json({ count: rows.length, predictions: rows });
    }

    // ----- /predict -----
    if (req.method === "GET") {
      const matchId = url.searchParams.get("match_id");
      if (!matchId) return json({ error: "match_id required" }, 400);
      const { data, error } = await admin
        .from("predictions")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "not_found" }, 404);
      return json({ prediction: maskPremium(data, allowPremium) });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body?.match_id || !body?.home_team || !body?.away_team || !body?.league || !body?.match_date) {
        return json({ error: "match_id, home_team, away_team, league, match_date required" }, 400);
      }

      // Return cached if exists
      const { data: existing } = await admin
        .from("predictions")
        .select("*")
        .eq("match_id", body.match_id)
        .maybeSingle();
      if (existing) {
        return json({ cached: true, prediction: maskPremium(existing, allowPremium) });
      }

      // Generate via AI
      const ai = await generatePrediction(body as MatchInput);

      const { data: inserted, error: insErr } = await admin
        .from("predictions")
        .insert({
          match_id: body.match_id,
          home_team: body.home_team,
          away_team: body.away_team,
          league: body.league,
          match_date: body.match_date,
          sport: body.sport ?? "football",
          prediction: ai.prediction,
          confidence: ai.confidence,
          reasoning: ai.reasoning,
          odds_value: ai.odds_value,
          ai_model: "google/gemini-2.5-flash",
          is_premium: ai.confidence >= 80,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      return json({ cached: false, prediction: maskPremium(inserted, allowPremium) });
    }

    return json({ error: "method_not_allowed" }, 405);
  } catch (e: any) {
    console.error("predict error:", e);
    const msg = e?.message ?? "Unknown error";
    if (msg.includes("429")) return json({ error: "rate_limited", message: msg }, 429);
    if (msg.includes("402")) return json({ error: "payment_required", message: msg }, 402);
    return json({ error: "internal_error", message: msg }, 500);
  }
});
