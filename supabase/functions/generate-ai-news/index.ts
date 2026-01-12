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

    console.log('Starting AI sports news generation...');

    // Get current date context for timely articles
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Diverse news topics with current context
    const newsTopics = [
      { 
        category: 'Match Preview', 
        prompt: `Write a compelling match preview article for an upcoming Premier League or La Liga match happening this weekend (${dayOfWeek}, ${dateStr}). Include:
- Team current form and league position
- Key player battles to watch
- Injury/suspension updates
- Head-to-head statistics
- Expert prediction with reasoning
Make it timely, engaging, and informative.`
      },
      { 
        category: 'Transfer News', 
        prompt: `Write breaking transfer news about a realistic transfer rumor in European football as of ${dateStr}. Include:
- Player name and current club
- Interested clubs and potential fee
- Agent/insider quotes (fictional but realistic)
- Timeline and likelihood analysis
- How this would affect both teams
Make it feel like authentic breaking news.`
      },
      { 
        category: 'Analysis', 
        prompt: `Write an in-depth tactical analysis article about current football trends as of ${dateStr}. Choose from:
- A manager's revolutionary tactics
- Why a team is over/underperforming
- Player performance deep dive
- League comparison analysis
Include stats, tactical diagrams description, and expert insights.`
      },
      { 
        category: 'Betting Tips', 
        prompt: `Write professional betting tips for this weekend's football matches (${dateStr}). Include:
- 3-5 recommended bets across major leagues
- Odds analysis and value identification
- Risk assessment (low/medium/high)
- Accumulator suggestion with reasoning
- Bankroll management advice
Make it responsible and analytical.`
      },
      { 
        category: 'Breaking News', 
        prompt: `Write a breaking football news story that feels current for ${dateStr}. Could be about:
- A manager sacking or appointment
- A controversial VAR decision aftermath
- Player contract extension/departure
- Club financial news
- International team announcement
Make it feel urgent and newsworthy.`
      },
      { 
        category: 'Player Spotlight', 
        prompt: `Write a player spotlight feature article as of ${dateStr}. Focus on:
- A rising star or in-form player
- Their journey and playing style
- Current season statistics
- Comparisons to legends
- Future potential and transfer interest
Make it inspiring and insightful.`
      }
    ];

    // Randomly select 2-3 topics to avoid generating too many articles
    const shuffled = newsTopics.sort(() => Math.random() - 0.5);
    const selectedTopics = shuffled.slice(0, 3);

    const generatedArticles = [];

    for (const topic of selectedTopics) {
      try {
        console.log(`Generating ${topic.category} article...`);

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
                content: `You are a professional sports journalist for PredictPro Guru, a leading sports prediction platform. Generate engaging, well-researched football news articles. 

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "title": "Catchy, SEO-friendly headline (max 80 chars)",
  "excerpt": "Compelling summary that hooks readers (max 160 chars)",
  "content": "Full article with multiple paragraphs, quotes, and analysis (500-800 words)",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "featured_image": "Description of ideal header image"
}

Make content feel current, authentic, and valuable to football fans and bettors.`
              },
              { role: 'user', content: topic.prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.log('Rate limited, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          console.error('AI API error:', aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        if (!content) {
          console.log('No content in AI response');
          continue;
        }

        // Parse the AI response
        let articleData;
        try {
          const cleanContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            articleData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (parseError) {
          console.log('JSON parse error, using fallback structure');
          articleData = {
            title: `${topic.category}: Latest Football Update - ${dateStr}`,
            excerpt: content.substring(0, 150).replace(/[{}"]/g, ''),
            content: content.replace(/```json\n?/g, '').replace(/```\n?/g, ''),
            tags: [topic.category.toLowerCase().replace(' ', '-'), 'football', 'premier-league', 'predictions']
          };
        }

        // Generate unique slug
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 80) + '-' + Date.now();

        // Check for duplicate titles (avoid spam)
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
            featured_image: articleData.featured_image || null,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log(`Successfully created: ${articleData.title}`);
          generatedArticles.push({
            title: articleData.title,
            category: topic.category
          });
        }

        // Rate limiting between articles
        await new Promise(resolve => setTimeout(resolve, 2000));
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
