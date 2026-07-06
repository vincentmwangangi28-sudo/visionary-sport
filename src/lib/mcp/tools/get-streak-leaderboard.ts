declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_streak_leaderboard",
  title: "Get streak leaderboard",
  description:
    "Returns the top users by prediction streak (current and longest) with total correct picks and win rates. Usernames are anonymised.",
  inputSchema: {
    metric: z.enum(["current_streak", "longest_streak", "total_correct"]).optional()
      .describe("Ranking metric. Default longest_streak."),
    limit: z.number().min(1).max(50).optional().describe("Max rows. Default 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ metric, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const orderBy = metric ?? "longest_streak";
    const { data, error } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, total_correct, last_prediction_date")
      .order(orderBy, { ascending: false })
      .limit(limit ?? 10);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    const ranked = (data ?? []).map((row, i) => ({ rank: i + 1, ...row }));
    return {
      content: [{ type: "text", text: JSON.stringify(ranked, null, 2) }],
      structuredContent: { leaderboard: ranked, metric: orderBy },
    };
  },
});
