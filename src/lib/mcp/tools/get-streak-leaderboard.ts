import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_streak_leaderboard",
  title: "Get my streak stats",
  description:
    "Returns prediction streak stats (current streak, longest streak, total correct picks) visible to the signed-in user. Requires sign-in; row-level security limits rows to the caller's own data.",
  inputSchema: {
    metric: z.enum(["current_streak", "longest_streak", "total_correct"]).optional()
      .describe("Ranking metric. Default longest_streak."),
    limit: z.number().min(1).max(50).optional().describe("Max rows. Default 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ metric, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
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
