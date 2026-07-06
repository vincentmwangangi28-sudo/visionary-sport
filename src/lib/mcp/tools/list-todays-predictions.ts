import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_todays_predictions",
  title: "List today's predictions",
  description:
    "Returns PredictPro's AI football/sports predictions for today, sorted by confidence. Non-premium only.",
  inputSchema: {
    minConfidence: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Minimum confidence percentage (0-100). Defaults to 70."),
    limit: z.number().min(1).max(50).optional().describe("Max results. Defaults to 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ minConfidence, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const { data, error } = await supabase
      .from("predictions")
      .select(
        "match_id, home_team, away_team, league, sport, prediction, confidence, reasoning, match_date, odds_value",
      )
      .eq("is_premium", false)
      .gte("match_date", start.toISOString())
      .lt("match_date", end.toISOString())
      .gte("confidence", minConfidence ?? 70)
      .order("confidence", { ascending: false })
      .limit(limit ?? 20);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { predictions: data ?? [] },
    };
  },
});
