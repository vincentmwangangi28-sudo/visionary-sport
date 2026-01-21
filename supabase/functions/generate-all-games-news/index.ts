import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    
    // Fetch today's and tomorrow's matches from multiple sources
    const matches: Match[] = [];
    
    // 1. Get matches from our database (upcoming_matches table)
    const { data: dbMatches } = await supabase
      .from('upcoming_matches')
      .select('*')
      .gte('match_date', new Date().toISOString().split('T')[0])
      .lte('match_date', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(20);

    if (dbMatches) {
      matches.push(...dbMatches.map(m => ({
        id: m.id,
        home_team: m.home_team,
        away_team: m.away_team,
        competition: m.competition || 'Football',
        match_date: m.match_date,
        status: m.status
      })));
    }

    // 2. Fetch from Football-Data.org API
    if (footballDataToken) {
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
            for (const m of data.matches.slice(0, 15)) {
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

    // 3. Add popular leagues for comprehensive coverage
    const majorLeagues = [
      'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
      'Champions League', 'Europa League', 'MLS', 'Saudi Pro League'
    ];

    console.log(`Found ${matches.length} matches to cover`);

    const generatedArticles: { title: string; category: string; match?: string }[] = [];
    const processedMatches = new Set<string>();

    // Generate match-specific news for unique matches
    for (const match of matches.slice(0, 8)) {
      const matchKey = `${match.home_team}-${match.away_team}`;
      if (processedMatches.has(matchKey)) continue;
      processedMatches.add(matchKey);

      try {
        // Check if we already have an article for this match today
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

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `You are a professional sports journalist for PredictPro Guru. Generate engaging match preview and betting analysis articles.

RESPOND WITH VALID JSON ONLY:
{
  "title": "SEO-optimized headline mentioning both teams (max 80 chars)",
  "excerpt": "Compelling preview summary (max 160 chars)",
  "content": "Detailed article with: team form, key players, H2H stats, injury news, prediction, betting tips (600-900 words)",
  "tags": ["team1", "team2", "competition", "predictions", "betting-tips"],
  "prediction": "Match prediction (e.g., Home Win, Draw, Away Win)",
  "confidence": 75
}`
              },
              { 
                role: 'user', 
                content: `Write a comprehensive match preview for:
${match.home_team} vs ${match.away_team}
Competition: ${match.competition}
Date: ${new Date(match.match_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Include:
1. Both teams' current form and league position
2. Head-to-head history and recent meetings
3. Key players and potential match-winners
4. Injury/suspension updates
5. Tactical analysis and expected formations
6. Expert prediction with reasoning
7. Betting tips with recommended markets`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.log('Rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          console.error('AI error:', aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
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
            excerpt: `Complete preview and betting analysis for ${match.home_team} vs ${match.away_team} in ${match.competition}`,
            content: content.replace(/```json\n?/g, '').replace(/```\n?/g, ''),
            tags: [match.home_team.toLowerCase().replace(/\s+/g, '-'), match.away_team.toLowerCase().replace(/\s+/g, '-'), 'predictions'],
            prediction: 'See article',
            confidence: 70
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
          generatedArticles.push({
            title: articleData.title,
            category: 'Match Preview',
            match: matchKey
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error for ${matchKey}:`, err);
      }
    }

    // Generate league roundup articles
    const leagueRoundups = ['Premier League', 'Champions League', 'La Liga'];
    for (const league of leagueRoundups.slice(0, 1)) {
      try {
        // Check for existing roundup today
        const { data: existingRoundup } = await supabase
          .from('news_articles')
          .select('id')
          .ilike('title', `%${league}%`)
          .ilike('title', `%roundup%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existingRoundup && existingRoundup.length > 0) {
          console.log(`${league} roundup exists, skipping...`);
          continue;
        }

        console.log(`Generating ${league} roundup...`);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `You are a sports journalist. Generate a comprehensive league roundup article.

RESPOND WITH VALID JSON:
{
  "title": "Catchy roundup headline (max 80 chars)",
  "excerpt": "Summary of key developments (max 160 chars)",
  "content": "Full roundup covering all major matches, standings updates, talking points (800-1000 words)",
  "tags": ["league-name", "roundup", "football", "analysis"]
}`
              },
              { 
                role: 'user', 
                content: `Write a ${league} matchday roundup for ${dateStr}. Cover:
1. All major matches and results
2. Standout performances
3. Updated league standings implications
4. Key talking points and controversies
5. Best goals and saves
6. What to watch next matchday
7. Betting insights for upcoming fixtures`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            let articleData;
            try {
              const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
              articleData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch {
              articleData = {
                title: `${league} Matchday Roundup: ${dateStr}`,
                excerpt: `Complete roundup of all ${league} action`,
                content: content,
                tags: [league.toLowerCase().replace(/\s+/g, '-'), 'roundup', 'football']
              };
            }

            if (articleData) {
              const slug = `${league.toLowerCase().replace(/\s+/g, '-')}-roundup-${Date.now()}`;
              
              await supabase
                .from('news_articles')
                .insert({
                  title: articleData.title,
                  slug,
                  content: articleData.content,
                  excerpt: articleData.excerpt,
                  category: 'League Roundup',
                  tags: articleData.tags || [],
                  author: 'PredictPro AI',
                  is_published: true,
                });

              generatedArticles.push({
                title: articleData.title,
                category: 'League Roundup'
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error generating ${league} roundup:`, err);
      }
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
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
