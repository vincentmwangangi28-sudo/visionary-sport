declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_upcoming_predictions",
  title: "List upcoming predictions",
  description:
    "Returns upcoming (future) non-premium predictions within a look-ahead window in days.",
  inputSchema: {
    days: z.number().min(1).max(14).optional().describe("Look-ahead window in days. Default 3."),
    league: z.string().optional().describe("Optional league name filter (exact match)."),
    limit: z.number().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days, league, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const now = new Date();
    const end = new Date(now.getTime() + (days ?? 3) * 24 * 60 * 60 * 1000);

    let q = supabase
      .from("predictions")
      .select("match_id, home_team, away_team, league, sport, prediction, confidence, match_date")
      .eq("is_premium", false)
      .gte("match_date", now.toISOString())
      .lte("match_date", end.toISOString())
      .order("match_date", { ascending: true })
      .limit(limit ?? 20);
    if (league) q = q.eq("league", league);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { matches: data ?? [] },
    };
  },
});
