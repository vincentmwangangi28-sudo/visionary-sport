declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_upcoming_matches",
  title: "List upcoming matches",
  description:
    "Returns cached upcoming football matches with predictions and confidence. Sourced from ESPN, TheSportsDB, and Football-Data.org.",
  inputSchema: {
    league: z.string().optional().describe("Optional league name filter (exact match)."),
    limit: z.number().min(1).max(50).optional().describe("Max results. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ league, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    let q = supabase
      .from("upcoming_matches_cache")
      .select("match_id, home_team, away_team, league, sport, match_date, match_time, prediction, confidence")
      .gte("match_date", new Date().toISOString())
      .order("match_date", { ascending: true })
      .limit(limit ?? 20);
    if (league) q = q.eq("league", league);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { matches: data ?? [] },
    };
  },
});
