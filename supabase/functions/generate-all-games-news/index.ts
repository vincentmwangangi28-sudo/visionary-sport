import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  competition: string;
  match_date: string;
  status?: string;
}

async function callAIWithRetry(lovableApiKey: string, messages: unknown[], maxRetries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }

      if (response.status === 429 || response.status === 402) {
        const delay = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
        console.log(`AI rate limited (${response.status}), retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      console.error('AI error:', response.status);
      return null;
    } catch (e) {
      console.error(`AI call error attempt ${attempt + 1}:`, e);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting all-games news generation...');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const matches: Match[] = [];
    
    // 1. Get matches from upcoming_matches_cache table
    const { data: dbMatches } = await supabase
      .from('upcoming_matches_cache')
      .select('*')
      .gte('match_date', new Date().toISOString().split('T')[0])
      .lte('match_date', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(20);

    if (dbMatches) {
      matches.push(...dbMatches.map(m => ({
        id: m.match_id,
        home_team: m.home_team,
        away_team: m.away_team,
        competition: m.league || 'Football',
        match_date: m.match_date,
        status: 'SCHEDULED'
      })));
    }

    // 2. Fetch from Football-Data.org API
    if (footballDataToken && matches.length < 6) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await fetch(
          `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${tomorrow}`,
          { headers: { 'X-Auth-Token': footballDataToken } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.matches) {
            for (const m of data.matches.slice(0, 10)) {
              const matchKey = `${m.homeTeam?.name}-${m.awayTeam?.name}`;
              if (matches.some(existing => `${existing.home_team}-${existing.away_team}` === matchKey)) continue;
              matches.push({
                id: String(m.id),
                home_team: m.homeTeam?.name || 'Home Team',
                away_team: m.awayTeam?.name || 'Away Team',
                competition: m.competition?.name || 'Football',
                match_date: m.utcDate,
                status: m.status
              });
            }
          }
        }
      } catch (e) {
        console.log('Football-Data API error:', e);
      }
    }

    console.log(`Found ${matches.length} matches to cover`);

    const generatedArticles: { title: string; category: string; match?: string }[] = [];
    const processedMatches = new Set<string>();

    // Generate match-specific news (limit to 4 to stay within rate limits)
    for (const match of matches.slice(0, 4)) {
      const matchKey = `${match.home_team}-${match.away_team}`;
      if (processedMatches.has(matchKey)) continue;
      processedMatches.add(matchKey);

      try {
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .ilike('title', `%${match.home_team.split(' ')[0]}%`)
          .ilike('title', `%${match.away_team.split(' ')[0]}%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`Article exists for ${matchKey}, skipping...`);
          continue;
        }

        console.log(`Generating article for: ${match.home_team} vs ${match.away_team}`);

        const content = await callAIWithRetry(lovableApiKey, [
          { 
            role: 'system', 
            content: `You are a professional sports journalist for PredictPro Guru. Generate engaging match preview articles.

RESPOND WITH VALID JSON ONLY:
{
  "title": "SEO-optimized headline mentioning both teams (max 80 chars)",
  "excerpt": "Compelling preview summary (max 160 chars)",
  "content": "Detailed article with: team form, key players, H2H stats, injury news, prediction, betting tips (600-900 words)",
  "tags": ["team1", "team2", "competition", "predictions", "betting-tips"]
}`
          },
          { 
            role: 'user', 
            content: `Write a match preview for ${match.home_team} vs ${match.away_team} in ${match.competition} on ${new Date(match.match_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`
          }
        ]);

        if (!content) continue;

        let articleData;
        try {
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            articleData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch {
          articleData = {
            title: `${match.home_team} vs ${match.away_team}: Match Preview & Prediction`,
            excerpt: `Complete preview for ${match.home_team} vs ${match.away_team} in ${match.competition}`,
            content: content.replace(/```json\n?/g, '').replace(/```\n?/g, ''),
            tags: ['predictions', 'match-preview'],
          };
        }

        const slug = `${match.home_team.toLowerCase().replace(/\s+/g, '-')}-vs-${match.away_team.toLowerCase().replace(/\s+/g, '-')}-preview-${Date.now()}`.substring(0, 100);

        const { error: insertError } = await supabase
          .from('news_articles')
          .insert({
            title: articleData.title,
            slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            category: 'Match Preview',
            tags: articleData.tags || [],
            author: 'PredictPro AI',
            is_published: true,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log(`Created article: ${articleData.title}`);
          generatedArticles.push({ title: articleData.title, category: 'Match Preview', match: matchKey });
        }

        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (err) {
        console.error(`Error for ${matchKey}:`, err);
      }
    }

    // Generate one league roundup
    try {
      const { data: existingRoundup } = await supabase
        .from('news_articles')
        .select('id')
        .ilike('title', '%roundup%')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!existingRoundup || existingRoundup.length === 0) {
        console.log('Generating league roundup...');

        const roundupContent = await callAIWithRetry(lovableApiKey, [
          { 
            role: 'system', 
            content: `You are a sports journalist. Generate a league roundup article.

RESPOND WITH VALID JSON:
{
  "title": "Catchy roundup headline (max 80 chars)",
  "excerpt": "Summary of key developments (max 160 chars)",
  "content": "Full roundup covering matches, standings, talking points (800-1000 words)",
  "tags": ["premier-league", "roundup", "football", "analysis"]
}`
          },
          { role: 'user', content: `Write a Premier League matchday roundup for ${dateStr}.` }
        ]);

        if (roundupContent) {
          let articleData;
          try {
            const cleanContent = roundupContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            articleData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            articleData = {
              title: `Premier League Matchday Roundup: ${dateStr}`,
              excerpt: 'Complete roundup of all Premier League action',
              content: roundupContent,
              tags: ['premier-league', 'roundup', 'football']
            };
          }

          if (articleData) {
            const slug = `premier-league-roundup-${Date.now()}`;
            await supabase.from('news_articles').insert({
              title: articleData.title,
              slug,
              content: articleData.content,
              excerpt: articleData.excerpt,
              category: 'League Roundup',
              tags: articleData.tags || [],
              author: 'PredictPro AI',
              is_published: true,
            });
            generatedArticles.push({ title: articleData.title, category: 'League Roundup' });
          }
        }
      }
    } catch (err) {
      console.error('Error generating roundup:', err);
    }

    console.log(`All-games news generation complete. Created ${generatedArticles.length} articles.`);

    return new Response(JSON.stringify({ 
      success: true, 
      articlesGenerated: generatedArticles.length,
      articles: generatedArticles,
      matchesProcessed: processedMatches.size,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-all-games-news:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
