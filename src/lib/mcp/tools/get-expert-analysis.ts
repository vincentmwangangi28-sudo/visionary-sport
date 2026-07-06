declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_expert_analysis",
  title: "Get expert match analysis",
  description:
    "Returns in-depth expert analysis for a specific match: form breakdown, head-to-head, key stats, injuries, and betting tips.",
  inputSchema: {
    matchId: z.string().describe("The match_id to fetch analysis for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ matchId }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("expert_analysis")
      .select("match_id, form_analysis, head_to_head, key_stats, injury_report, betting_tips, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No expert analysis found for match ${matchId}.` }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { analysis: data },
    };
  },
});
