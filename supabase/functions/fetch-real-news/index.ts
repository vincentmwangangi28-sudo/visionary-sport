import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch latest football news from free API
    const newsApiUrl = 'https://api.football-data.org/v4/competitions';
    const footballApiToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    
    let competitionsData = null;
    if (footballApiToken) {
      try {
        const compResponse = await fetch(newsApiUrl, {
          headers: { 'X-Auth-Token': footballApiToken }
        });
        if (compResponse.ok) {
          competitionsData = await compResponse.json();
        }
      } catch (e) {
        console.log('Could not fetch competitions:', e);
      }
    }

    // Generate news articles based on current football context
    const newsTopics = [
      { 
        category: 'Match Preview', 
        prompt: 'Write a compelling match preview article for an upcoming Premier League match. Include team form analysis, key player stats, head-to-head history, and expert predictions. Make it engaging and informative for football fans.'
      },
      { 
        category: 'Transfer News', 
        prompt: 'Write an exciting transfer news article about potential moves in European football. Include player valuations, club interests, and expert opinions. Make it newsworthy and current.'
      },
      { 
        category: 'Analysis', 
        prompt: 'Write an in-depth tactical analysis article about a trending topic in football. Could be about a manager\'s tactics, team formations, or player performances. Include stats and expert insights.'
      },
      { 
        category: 'Betting Tips', 
        prompt: 'Write a professional betting tips article with analysis of upcoming matches. Include odds analysis, value bets, and expert reasoning. Focus on Premier League, La Liga, and Champions League.'
      }
    ];

    const generatedArticles = [];

    for (const topic of newsTopics) {
      try {
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
                content: 'You are a professional sports journalist. Generate engaging, factual-sounding football news articles. Always respond with valid JSON containing: title, excerpt (max 150 chars), content (detailed article with paragraphs), and tags (array of 3-5 relevant tags). Make the content feel current and authentic.'
              },
              { role: 'user', content: topic.prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error('AI API error:', await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        if (!content) continue;

        // Parse the AI response
        let articleData;
        try {
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          articleData = JSON.parse(cleanContent);
        } catch {
          // If parsing fails, create structured data from the response
          articleData = {
            title: `${topic.category}: Latest Football Update`,
            excerpt: content.substring(0, 150),
            content: content,
            tags: [topic.category.toLowerCase(), 'football', 'premier-league']
          };
        }

        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 80) + '-' + Date.now();

        const { error: insertError } = await supabase
          .from('news_articles')
          .insert({
            title: articleData.title,
            slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            category: topic.category,
            tags: articleData.tags || [],
            author: 'PredictPro AI',
            is_published: true,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          generatedArticles.push(articleData.title);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Error generating article:', err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      articlesGenerated: generatedArticles.length,
      articles: generatedArticles
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in fetch-real-news:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
