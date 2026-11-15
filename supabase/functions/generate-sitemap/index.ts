import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CANONICAL_MATCH_SLUG_REDIRECTS: Record<string, string> = {
  "man-utd-vs-arsenal": "arsenal-vs-chelsea",
  "man-city-vs-liverpool": "liverpool-vs-manchester-city",
  "barca-vs-real-madrid": "real-madrid-vs-barcelona",
  "manchester-united-vs-tottenham-hotspur": "manchester-united-vs-tottenham",
  "young-africans-vs-simba-sc": "simba-sc-vs-young-africans",
  "newcastle-united-vs-aston-villa": "arsenal-vs-chelsea",
  "ajax-vs-psv-eindhoven": "ajax-vs-feyenoord",
  "benfica-vs-porto": "benfica-vs-sporting-cp",
  "inter-miami-vs-la-galaxy": "inter-miami-vs-new-york-red-bulls",
};

function sanitizeSlug(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCanonicalMatchSlug(homeTeam: string, awayTeam: string): string {
  const raw = `${sanitizeSlug(homeTeam)}-vs-${sanitizeSlug(awayTeam)}`;
  return CANONICAL_MATCH_SLUG_REDIRECTS[raw] || raw;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const today = new Date().toISOString().split("T")[0];
  const reqUrl = new URL(req.url || "https://www.predictpro.guru/sitemap-matches.xml");
  const onlyMatches =
    reqUrl.pathname.endsWith("sitemap-matches.xml") ||
    reqUrl.searchParams.get("type") === "matches";

  const [{ data: activePreds }, { data: activeMatches }, { data: posts }] = await Promise.all([
    supabase
      .from("predictions")
      .select("home_team, away_team, league, match_date")
      .order("match_date", { ascending: false })
      .limit(200),
    supabase
      .from("matches")
      .select("home_team, away_team, league, match_date")
      .order("match_date", { ascending: false })
      .limit(200),
    supabase
      .from("blog_posts")
      .select("slug, published_at, created_at")
      .order("published_at", { ascending: false }),
  ]);

  const seenMatchSlugs = new Set<string>();
  const matchUrls: string[] = [];

  for (const row of [...(activePreds ?? []), ...(activeMatches ?? [])]) {
    if (!row?.home_team || !row?.away_team) continue;
    const slug = buildCanonicalMatchSlug(row.home_team, row.away_team);
    if (!slug || !slug.includes("-vs-") || seenMatchSlugs.has(slug)) continue;
    seenMatchSlugs.add(slug);
    const lastmod = (row.match_date ?? today).toString().split("T")[0] || today;
    matchUrls.push(
      `  <url><loc>https://www.predictpro.guru/predict/${slug}</loc><changefreq>hourly</changefreq><priority>0.85</priority><lastmod>${lastmod}</lastmod></url>`
    );
  }

  if (onlyMatches) {
    const matchesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${matchUrls.join("\n")}
</urlset>`;
    return new Response(matchesSitemap, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      },
    });
  }

  const staticPages = [
    { url: "/", priority: "1.0", freq: "hourly" },
    { url: "/best-bets", priority: "0.95", freq: "daily" },
    { url: "/predict", priority: "0.95", freq: "daily" },
    { url: "/live", priority: "0.9", freq: "always" },
    { url: "/value-bets", priority: "0.9", freq: "daily" },
    { url: "/correct-score", priority: "0.9", freq: "daily" },
    { url: "/btts", priority: "0.9", freq: "daily" },
    { url: "/standings", priority: "0.85", freq: "daily" },
    { url: "/accumulator", priority: "0.85", freq: "daily" },
    { url: "/news", priority: "0.85", freq: "hourly" },
    { url: "/highlights", priority: "0.85", freq: "hourly" },
    { url: "/blog", priority: "0.85", freq: "daily" },
    { url: "/dropping-odds", priority: "0.8", freq: "hourly" },
    { url: "/screener", priority: "0.8", freq: "daily" },
    { url: "/track-record", priority: "0.8", freq: "daily" },
    { url: "/statistics", priority: "0.8", freq: "daily" },
    { url: "/tipsters", priority: "0.8", freq: "hourly" },
    { url: "/tournaments", priority: "0.8", freq: "daily" },
    { url: "/upcoming", priority: "0.8", freq: "daily" },
    { url: "/insights", priority: "0.75", freq: "daily" },
    { url: "/players", priority: "0.75", freq: "weekly" },
    { url: "/leaderboard", priority: "0.75", freq: "daily" },
    { url: "/sports", priority: "0.75", freq: "daily" },
    { url: "/recommendations", priority: "0.75", freq: "daily" },
    { url: "/archive", priority: "0.7", freq: "daily" },
    { url: "/methodology", priority: "0.65", freq: "monthly" },
    { url: "/bankroll", priority: "0.7", freq: "monthly" },
    { url: "/shop", priority: "0.8", freq: "weekly" },
    { url: "/about", priority: "0.6", freq: "monthly" },
    { url: "/premier-league-predictions", priority: "0.9", freq: "daily" },
    { url: "/champions-league-predictions", priority: "0.9", freq: "daily" },
    { url: "/kpl-predictions", priority: "0.9", freq: "daily" },
    { url: "/jackpot-predictions", priority: "0.9", freq: "daily" },
    { url: "/us-soccer-predictions", priority: "0.9", freq: "daily" },
    { url: "/la-liga-predictions", priority: "0.9", freq: "daily" },
    { url: "/bundesliga-predictions", priority: "0.9", freq: "daily" },
    { url: "/serie-a-predictions", priority: "0.9", freq: "daily" },
    { url: "/world-cup-predictions", priority: "0.85", freq: "daily" },
    { url: "/afcon-predictions", priority: "0.85", freq: "daily" },
  ];

  const blogUrls = (posts ?? []).map((p) => {
    const lastmod = (p.published_at ?? p.created_at ?? today).toString().split("T")[0];
    return `  <url><loc>https://www.predictpro.guru/blog/${encodeURIComponent(p.slug)}</loc><changefreq>monthly</changefreq><priority>0.6</priority><lastmod>${lastmod}</lastmod></url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((p) => `  <url><loc>https://www.predictpro.guru${p.url}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority><lastmod>${today}</lastmod></url>`).join("\n")}
${matchUrls.join("\n")}
${blogUrls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

