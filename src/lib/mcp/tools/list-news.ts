import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_news",
  title: "List news articles",
  description: "Returns the most recent published football/sports news articles from PredictPro.",
  inputSchema: {
    limit: z.number().min(1).max(50).optional().describe("Max articles. Default 10."),
    category: z.string().optional().describe("Optional category filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    let q = supabase
      .from("news_articles")
      .select("id, title, summary, category, published_at, slug, source_url")
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
