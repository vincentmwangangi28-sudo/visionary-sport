import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

      console.error('AI API error:', response.status);
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
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting AI sports news generation...');

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const newsTopics = [
      { 
        category: 'Match Preview', 
        prompt: `Write a compelling match preview article for an upcoming Premier League or La Liga match happening this weekend (${dayOfWeek}, ${dateStr}). Include team form, key players, injuries, H2H stats, and expert prediction.`
      },
      { 
        category: 'Transfer News', 
        prompt: `Write breaking transfer news about a realistic transfer rumor in European football as of ${dateStr}. Include player name, clubs, potential fee, and likelihood.`
      },
      { 
        category: 'Analysis', 
        prompt: `Write an in-depth tactical analysis article about current football trends as of ${dateStr}. Cover a manager's tactics, team performance, or player analysis.`
      },
      { 
        category: 'Betting Tips', 
        prompt: `Write professional betting tips for this weekend's football matches (${dateStr}). Include 3-5 recommended bets, odds analysis, and bankroll advice.`
      },
      { 
        category: 'Breaking News', 
        prompt: `Write a breaking football news story that feels current for ${dateStr}. Could be about a manager, VAR, player contract, or club news.`
      },
      { 
        category: 'Player Spotlight', 
        prompt: `Write a player spotlight feature article as of ${dateStr} about a rising star or in-form player with stats and analysis.`
      }
    ];

    // Select 2 random topics to stay within rate limits
    const shuffled = newsTopics.sort(() => Math.random() - 0.5);
    const selectedTopics = shuffled.slice(0, 2);

    const generatedArticles = [];

    for (const topic of selectedTopics) {
      try {
        console.log(`Generating ${topic.category} article...`);

        const content = await callAIWithRetry(lovableApiKey, [
          { 
            role: 'system', 
            content: `You are a professional sports journalist for PredictPro Guru. Generate engaging football news articles. 

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "title": "Catchy, SEO-friendly headline (max 80 chars)",
  "excerpt": "Compelling summary that hooks readers (max 160 chars)",
  "content": "Full article with multiple paragraphs, quotes, and analysis (500-800 words)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`
          },
          { role: 'user', content: topic.prompt }
        ]);

        if (!content) {
          console.log(`No content from AI for ${topic.category}, skipping`);
          continue;
        }

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
          console.log('JSON parse error, using fallback structure');
          articleData = {
            title: `${topic.category}: Latest Football Update - ${dateStr}`,
            excerpt: content.substring(0, 150).replace(/[{}"]/g, ''),
            content: content.replace(/```json\n?/g, '').replace(/```\n?/g, ''),
            tags: [topic.category.toLowerCase().replace(' ', '-'), 'football', 'predictions']
          };
        }

        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 80) + '-' + Date.now();

        // Check for duplicates
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .ilike('title', `%${articleData.title.substring(0, 30)}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log('Similar article exists, skipping...');
          continue;
        }

        const { error: insertError } = await supabase
          .from('news_articles')
          .insert({
            title: articleData.title,
            slug,
            content: articleData.content,
            excerpt: articleData.excerpt || articleData.content.substring(0, 150),
            category: topic.category,
            tags: articleData.tags || [topic.category.toLowerCase()],
            author: 'PredictPro AI',
            is_published: true,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log(`Successfully created: ${articleData.title}`);
          generatedArticles.push({ title: articleData.title, category: topic.category });
        }

        // Rate limiting between articles
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (err) {
        console.error(`Error generating ${topic.category} article:`, err);
      }
    }

    console.log(`News generation complete. Generated ${generatedArticles.length} articles.`);

    return new Response(JSON.stringify({ 
      success: true, 
      articlesGenerated: generatedArticles.length,
      articles: generatedArticles,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-ai-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
