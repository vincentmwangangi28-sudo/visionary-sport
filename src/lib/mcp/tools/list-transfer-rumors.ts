declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_transfer_rumors",
  title: "List transfer rumors",
  description:
    "Returns the latest football transfer rumors with probability scores, source, and target/current clubs.",
  inputSchema: {
    minProbability: z.number().min(0).max(100).optional().describe("Minimum probability (0-100). Default 0."),
    limit: z.number().min(1).max(50).optional().describe("Max rumors. Default 15."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ minProbability, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("transfer_rumors")
      .select("player_name, current_club, target_club, transfer_fee, probability, source, headline, is_confirmed, updated_at")
      .gte("probability", minProbability ?? 0)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 15);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { rumors: data ?? [] },
    };
  },
});
