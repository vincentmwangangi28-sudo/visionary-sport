declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_active_contests",
  title: "List active contests",
  description:
    "Returns PredictPro's currently active prediction contests with entry fees, prize pools, and end dates.",
  inputSchema: {
    limit: z.number().min(1).max(50).optional().describe("Max contests. Default 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("contests")
      .select("id, name, description, entry_fee, prize_pool, start_date, end_date, status")
      .eq("status", "active")
      .order("end_date", { ascending: true })
      .limit(limit ?? 10);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { contests: data ?? [] },
    };
  },
});
