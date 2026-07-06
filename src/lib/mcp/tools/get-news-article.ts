declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_news_article",
  title: "Get news article",
  description: "Fetches the full content of a specific news article by slug or ID.",
  inputSchema: {
    slugOrId: z.string().describe("Article slug or UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slugOrId }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const { data, error } = await supabase
      .from("news_articles")
      .select("id, title, slug, content, excerpt, category, tags, author, featured_image, view_count, created_at")
      .eq(isUuid ? "id" : "slug", slugOrId)
      .eq("is_published", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!data) return { content: [{ type: "text", text: `Article not found: ${slugOrId}` }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { article: data },
    };
  },
});
