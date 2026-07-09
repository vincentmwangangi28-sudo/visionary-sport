declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_value_bets",
  title: "List value bets",
  description:
    "Returns upcoming non-premium predictions where the model's confidence exceeds the bookmaker's implied probability. Computes edge %, Kelly fraction, and expected value per unit staked.",
  inputSchema: {
    minEdge: z.number().min(0).max(50).optional().describe("Minimum edge percentage. Default 5."),
    limit: z.number().min(1).max(50).optional().describe("Max results. Default 15."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ minEdge, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("predictions")
      .select("match_id, home_team, away_team, league, prediction, confidence, odds_value, match_date")
      .eq("is_premium", false)
      .gte("match_date", new Date().toISOString())
      .not("odds_value", "is", null)
      .gte("confidence", 55)
      .order("match_date", { ascending: true })
      .limit(80);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };

    const threshold = minEdge ?? 5;
    const bets = (data ?? [])
      .map((p: any) => {
        const odds = Number(p.odds_value);
        const conf = Number(p.confidence) / 100;
        if (!odds || odds <= 1) return null;
        const implied = 1 / odds;
        const edge = (conf - implied) * 100;
        const kelly = Math.max(0, (odds * conf - 1) / (odds - 1)) * 100;
        const ev = (conf * odds - 1) * 100;
        return {
          match_id: p.match_id,
          home_team: p.home_team,
          away_team: p.away_team,
          league: p.league,
          prediction: p.prediction,
          match_date: p.match_date,
          odds: odds,
          model_confidence_pct: p.confidence,
          market_implied_pct: Math.round(implied * 10000) / 100,
          edge_pct: Math.round(edge * 100) / 100,
          kelly_pct: Math.round(kelly * 100) / 100,
          ev_per_unit_pct: Math.round(ev * 100) / 100,
        };
      })
      .filter((b): b is NonNullable<typeof b> => !!b && b.edge_pct >= threshold)
      .sort((a, b) => b.edge_pct - a.edge_pct)
      .slice(0, limit ?? 15);

    return {
      content: [{ type: "text", text: JSON.stringify(bets, null, 2) }],
      structuredContent: { value_bets: bets, min_edge_pct: threshold },
    };
  },
});
