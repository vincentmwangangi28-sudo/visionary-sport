declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_platform_accuracy",
  title: "Get platform accuracy",
  description:
    "Returns PredictPro's recent overall prediction accuracy statistics (last N days).",
  inputSchema: {
    days: z.number().min(1).max(90).optional().describe("Number of recent days. Default 30."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("platform_accuracy")
      .select("date, total_predictions, correct_predictions, accuracy_percent, by_league")
      .order("date", { ascending: false })
      .limit(days ?? 30);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    const rows = data ?? [];
    const totals = rows.reduce(
      (a, r) => {
        a.total += r.total_predictions ?? 0;
        a.correct += r.correct_predictions ?? 0;
        return a;
      },
      { total: 0, correct: 0 },
    );
    const overall = totals.total > 0 ? (totals.correct / totals.total) * 100 : 0;
    const summary = {
      window_days: rows.length,
      total_predictions: totals.total,
      correct_predictions: totals.correct,
      overall_accuracy_percent: Math.round(overall * 100) / 100,
      daily: rows,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
