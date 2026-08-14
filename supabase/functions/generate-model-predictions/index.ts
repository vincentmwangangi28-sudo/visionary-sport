// Credit-free prediction generator.
// Uses a transparent Poisson baseline (league scoring rates + home advantage +
// team form derived from previously verified predictions) instead of the AI
// gateway, so predictions keep refreshing when AI credits are exhausted.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Average goals per team per game, by league (public season averages).
const LEAGUE_GOALS: Record<string, number> = {
  'Premier League': 1.45,
  'English Premier League': 1.45,
  'La Liga': 1.30,
  'Spanish LaLiga': 1.30,
  'Serie A': 1.38,
  'Italian Serie A': 1.38,
  'Bundesliga': 1.60,
  'German Bundesliga': 1.60,
  'Ligue 1': 1.42,
  'French Ligue 1': 1.42,
  'UEFA Champions League': 1.50,
  'Champions League': 1.50,
  'MLS': 1.50,
  'Major League Soccer': 1.50,
  'Kenya Premier League': 1.15,
};
const DEFAULT_GOALS = 1.38;
const HOME_ADVANTAGE = 1.18; // home teams score ~18% more than the league mean

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const poisson = (k: number, lambda: number) =>
  (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

interface Outcome {
  home: number;
  draw: number;
  away: number;
  over25: number;
  btts: number;
}

function scoreMatrix(lambdaHome: number, lambdaAway: number): Outcome {
  const MAX = 8;
  let home = 0, draw = 0, away = 0, over25 = 0, btts = 0;
  for (let h = 0; h <= MAX; h++) {
    for (let a = 0; a <= MAX; a++) {
      const p = poisson(h, lambdaHome) * poisson(a, lambdaAway);
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
      if (h + a > 2.5) over25 += p;
      if (h > 0 && a > 0) btts += p;
    }
  }
  return { home, draw, away, over25, btts };
}

/** Form multiplier in [0.85, 1.15] from a team's verified prediction history. */
function formMultiplier(wins: number, played: number): number {
  if (played < 3) return 1;
  const rate = wins / played;
  return 0.85 + Math.min(1, Math.max(0, rate)) * 0.3;
}

const JOB_NAME = 'generate-model-predictions';
/** Calendar date in East Africa Time (UTC+3), used to group daily runs. */
const eatDate = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Open an audit row so every run is visible in the run-history page.
  let runId: string | null = null;
  const { data: runRow } = await supabase
    .from('job_runs')
    .insert({
      job_name: JOB_NAME,
      status: 'running',
      eat_date: eatDate(),
      started_at: new Date().toISOString(),
      processed: 0,
    })
    .select('id')
    .maybeSingle();
  runId = runRow?.id ?? null;

  const finishRun = async (
    status: string,
    fields: { processed?: number; total_markets?: number; error?: string; metadata?: Record<string, unknown> } = {},
  ) => {
    if (!runId) return;
    await supabase
      .from('job_runs')
      .update({ status, finished_at: new Date().toISOString(), ...fields })
      .eq('id', runId);
  };

  try {
    const nowIso = new Date().toISOString();
    const horizon = new Date(Date.now() + 30 * 86400000).toISOString();

    const { data: matches, error: matchesError } = await supabase
      .from('upcoming_matches_cache')
      .select('match_id, home_team, away_team, league, sport, match_date')
      .gte('match_date', nowIso)
      .lte('match_date', horizon)
      .order('match_date', { ascending: true })
      .limit(60);

    if (matchesError) throw new Error(`cache read failed: ${matchesError.message}`);
    if (!matches || matches.length === 0) {
      await finishRun('skipped', { processed: 0, total_markets: 0, metadata: { message: 'No cached upcoming matches' } });
      return new Response(JSON.stringify({ success: true, created: 0, message: 'No cached upcoming matches' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Existing predictions: skip duplicates + build a crude form table.
    const { data: history } = await supabase
      .from('predictions')
      .select('match_id, home_team, away_team, prediction, result')
      .not('result', 'is', null)
      .order('match_date', { ascending: false })
      .limit(500);

    const form = new Map<string, { wins: number; played: number }>();
    const bump = (team: string, won: boolean) => {
      const entry = form.get(team) ?? { wins: 0, played: 0 };
      entry.played += 1;
      if (won) entry.wins += 1;
      form.set(team, entry);
    };
    for (const row of history ?? []) {
      const correct = row.result === 'correct';
      const backedHome = /home/i.test(row.prediction ?? '');
      const backedAway = /away/i.test(row.prediction ?? '');
      if (backedHome) {
        bump(row.home_team, correct);
        bump(row.away_team, !correct);
      } else if (backedAway) {
        bump(row.away_team, correct);
        bump(row.home_team, !correct);
      }
    }

    const ids = matches.map((m) => m.match_id);
    const { data: existing } = await supabase
      .from('predictions')
      .select('match_id')
      .in('match_id', ids);
    const alreadyPredicted = new Set((existing ?? []).map((r) => r.match_id));

    const rows: Record<string, unknown>[] = [];

    for (const match of matches) {
      if (alreadyPredicted.has(match.match_id)) continue;

      const base = LEAGUE_GOALS[match.league] ?? DEFAULT_GOALS;
      const homeForm = form.get(match.home_team) ?? { wins: 0, played: 0 };
      const awayForm = form.get(match.away_team) ?? { wins: 0, played: 0 };

      const lambdaHome = base * HOME_ADVANTAGE * formMultiplier(homeForm.wins, homeForm.played);
      const lambdaAway = (base / HOME_ADVANTAGE) * formMultiplier(awayForm.wins, awayForm.played);

      const o = scoreMatrix(lambdaHome, lambdaAway);

      // Prefer the match-result market; only switch to a goals market when it is
      // clearly stronger (10+ percentage points) than the best 1X2 selection.
      const resultMarkets = [
        { label: `${match.home_team} to win`, p: o.home },
        { label: 'Draw', p: o.draw },
        { label: `${match.away_team} to win`, p: o.away },
      ].sort((a, b) => b.p - a.p);
      const goalsMarkets = [
        { label: 'Over 2.5 goals', p: o.over25 },
        { label: 'Both teams to score', p: o.btts },
      ].sort((a, b) => b.p - a.p);

      const bestResult = resultMarkets[0];
      const bestGoals = goalsMarkets[0];
      const pick = bestGoals.p > bestResult.p + 0.10 ? bestGoals : bestResult;


      const confidence = Math.round(Math.min(92, Math.max(52, pick.p * 100)));
      const isUpset = pick.label.includes(match.away_team) && o.away > o.home;

      rows.push({
        match_id: match.match_id,
        home_team: match.home_team,
        away_team: match.away_team,
        league: match.league,
        sport: match.sport ?? 'football',
        match_date: match.match_date,
        prediction: pick.label,
        confidence,
        odds_value: Number((1 / Math.max(0.05, pick.p)).toFixed(2)),
        is_upset_alert: isUpset,
        is_premium: false,
        ai_model: 'poisson-baseline-v1',
        reasoning:
          `Statistical baseline (no AI): Poisson model on ${match.league} scoring rates ` +
          `(${base.toFixed(2)} goals/team/game) with an 18% home-field adjustment and recent-form weighting. ` +
          `Expected goals ${lambdaHome.toFixed(2)} - ${lambdaAway.toFixed(2)}. ` +
          `Modelled probabilities: home ${(o.home * 100).toFixed(1)}%, draw ${(o.draw * 100).toFixed(1)}%, ` +
          `away ${(o.away * 100).toFixed(1)}%, over 2.5 ${(o.over25 * 100).toFixed(1)}%, BTTS ${(o.btts * 100).toFixed(1)}%. ` +
          `Highest-probability selection: ${pick.label}. Model output only — not betting advice. 18+.`,
      });
    }

    if (rows.length === 0) {
      await finishRun('skipped', {
        processed: 0,
        total_markets: matches.length,
        metadata: { message: 'All cached matches already have predictions', scanned: matches.length },
      });
      return new Response(JSON.stringify({ success: true, created: 0, message: 'All cached matches already have predictions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase
      .from('predictions')
      .insert(rows);

    if (insertError) throw new Error(`insert failed: ${insertError.message}`);

    console.log(`📐 Generated ${rows.length} model predictions (no AI credits used)`);

    await finishRun('success', {
      processed: rows.length,
      total_markets: matches.length,
      metadata: {
        scanned: matches.length,
        model: 'poisson-baseline-v1',
        leagues: [...new Set(rows.map((r) => r.league as string))],
      },
    });

    return new Response(JSON.stringify({ success: true, created: rows.length, scanned: matches.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('generate-model-predictions error:', error);
    await finishRun('failed', { error: message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
