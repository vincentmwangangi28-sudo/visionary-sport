// Generates multi-market predictions for matches scheduled today.
// Markets: 1X2, BTTS, Clean Sheet (Home/Away), Both Teams Win Corners,
//          Over/Under 2.5, Over/Under 9.5 Corners, Double Chance,
//          HT Result, Score Range, First Goal.
// POST /generate-prediction-markets           -> generate for all of today's predictions
// POST /generate-prediction-markets { prediction_id } -> generate for one
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MARKET_DEFS = [
  { key: "1x2", label: "Match Result", values: ["Home Win", "Draw", "Away Win"], premiumThreshold: 0 },
  { key: "btts", label: "Both Teams To Score", values: ["Yes", "No"], premiumThreshold: 75 },
  { key: "clean_sheet_home", label: "Home Clean Sheet", values: ["Yes", "No"], premiumThreshold: 70 },
  { key: "clean_sheet_away", label: "Away Clean Sheet", values: ["Yes", "No"], premiumThreshold: 70 },
  { key: "both_win_corners", label: "Both Teams 4+ Corners", values: ["Yes", "No"], premiumThreshold: 70 },
  { key: "ou_2_5", label: "Over / Under 2.5 Goals", values: ["Over 2.5", "Under 2.5"], premiumThreshold: 0 },
  { key: "ou_corners_9_5", label: "Corners Over / Under 9.5", values: ["Over 9.5", "Under 9.5"], premiumThreshold: 65 },
  { key: "double_chance", label: "Double Chance", values: ["1X", "12", "X2"], premiumThreshold: 0 },
  { key: "ht_result", label: "Half-Time Result", values: ["Home HT", "Draw HT", "Away HT"], premiumThreshold: 70 },
  { key: "score_range", label: "Forecasted Score Range", values: ["0-1 goals", "2-3 goals", "4+ goals"], premiumThreshold: 80 },
  { key: "first_goal", label: "First Team To Score", values: ["Home", "Away", "No Goal"], premiumThreshold: 75 },
];

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
        throw new Error(`AI gateway ${res.status}`);
      }
      if (!res.ok) throw new Error(`AI gateway ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

async function generateForPrediction(supabase: any, p: any) {
  const prompt = `You are a football betting analyst. For the match below, return a STRICT JSON array with one object per market.
Each object: { "market_key": string, "market_value": string (must be one of the allowed values), "confidence": integer 35-95, "reasoning": short 1-sentence string }.
Match: ${p.home_team} vs ${p.away_team} | League: ${p.league} | Date: ${p.match_date}
Markets (key -> allowed values):
${MARKET_DEFS.map((m) => `- ${m.key}: ${m.values.join(" | ")}`).join("\n")}
Return ONLY the JSON array, no prose, no code fences.`;

  const ai = await callAIWithRetry({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
  });
  const raw: string = ai?.choices?.[0]?.message?.content ?? "[]";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: any[] = [];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) parsed = JSON.parse(m[0]);
  }

  const rows = MARKET_DEFS.map((def) => {
    const found = parsed.find((x: any) => x?.market_key === def.key);
    const value = def.values.includes(found?.market_value) ? found.market_value : def.values[0];
    const confidence = Math.max(
      35,
      Math.min(95, Number.parseInt(found?.confidence ?? 60, 10) || 60),
    );
    return {
      prediction_id: p.id,
      match_id: p.match_id,
      market_key: def.key,
      market_label: def.label,
      market_value: value,
      confidence,
      is_premium: def.premiumThreshold > 0 && confidence >= def.premiumThreshold,
      reasoning: typeof found?.reasoning === "string" ? found.reasoning.slice(0, 280) : null,
    };
  });

  const { error } = await supabase
    .from("prediction_markets")
    .upsert(rows, { onConflict: "prediction_id,market_key" });
  if (error) throw error;
  return rows.length;
}

const JOB_NAME = "generate-prediction-markets-daily";

// EAT = UTC+3, no DST. Compute current EAT date independent of server tz.
function eatDate(d = new Date()): string {
  const eatMs = d.getTime() + 3 * 60 * 60 * 1000;
  return new Date(eatMs).toISOString().slice(0, 10); // YYYY-MM-DD in EAT
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // "catchup" | null
  const today_eat = eatDate();
  const startedAt = new Date().toISOString();

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // Catch-up safety net: skip if today's run already succeeded.
    if (mode === "catchup" && !body?.prediction_id) {
      const { data: prior } = await supabase
        .from("job_runs")
        .select("id, status")
        .eq("job_name", JOB_NAME)
        .eq("eat_date", today_eat)
        .in("status", ["success", "partial"])
        .limit(1);
      if (prior && prior.length > 0) {
        await supabase.from("job_runs").insert({
          job_name: JOB_NAME,
          status: "skipped",
          eat_date: today_eat,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          metadata: { reason: "already_ran_today_eat", mode },
        });
        return json({ ok: true, skipped: true, reason: "already_ran_today_eat", eat_date: today_eat });
      }
    }

    let predictions: any[] = [];

    if (body?.prediction_id) {
      const { data, error } = await supabase
        .from("predictions")
        .select("id, match_id, home_team, away_team, league, match_date")
        .eq("id", body.prediction_id)
        .limit(1);
      if (error) throw error;
      predictions = data ?? [];
    } else {
      // EAT day window (UTC+3): [today 00:00 EAT, today 23:59:59.999 EAT)
      // In UTC that's [today-1 21:00 UTC, today 20:59:59.999 UTC) for the same EAT date.
      const eatMidnightUtcMs = Date.parse(`${today_eat}T00:00:00Z`) - 3 * 60 * 60 * 1000;
      const start = new Date(eatMidnightUtcMs);
      const end = new Date(eatMidnightUtcMs + 24 * 60 * 60 * 1000 - 1);
      const { data, error } = await supabase
        .from("predictions")
        .select("id, match_id, home_team, away_team, league, match_date")
        .gte("match_date", start.toISOString())
        .lte("match_date", end.toISOString());
      if (error) throw error;
      predictions = data ?? [];
    }

    let processed = 0;
    let totalMarkets = 0;
    const errors: string[] = [];

    for (const p of predictions) {
      try {
        totalMarkets += await generateForPrediction(supabase, p);
        processed++;
      } catch (e: any) {
        errors.push(`${p.match_id}: ${e?.message ?? e}`);
      }
    }

    // Log run (skip for single-prediction ad-hoc invocations)
    if (!body?.prediction_id) {
      const status =
        predictions.length === 0
          ? "success"
          : errors.length === 0
            ? "success"
            : processed > 0
              ? "partial"
              : "failed";
      await supabase.from("job_runs").insert({
        job_name: JOB_NAME,
        status,
        eat_date: today_eat,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        processed,
        total_markets: totalMarkets,
        error: errors.length ? errors.slice(0, 10).join(" | ").slice(0, 2000) : null,
        metadata: { mode: mode ?? "manual", predictions_found: predictions.length },
      });
    }

    return json({ ok: true, processed, totalMarkets, errors, eat_date: today_eat, mode: mode ?? "manual" });
  } catch (e: any) {
    await supabase.from("job_runs").insert({
      job_name: JOB_NAME,
      status: "failed",
      eat_date: today_eat,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error: (e?.message ?? String(e)).slice(0, 2000),
      metadata: { mode: mode ?? "manual" },
    }).then(() => {}, () => {});
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
