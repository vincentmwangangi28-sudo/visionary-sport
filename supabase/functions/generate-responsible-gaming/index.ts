import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎰 Generating responsible gaming content...');

    const weekNumber = Math.ceil((new Date().getDate()) / 7);
    const month = new Date().toLocaleString('default', { month: 'long' });

    const topics = [
      {
        title: `Responsible Betting Guide: ${month} Week ${weekNumber}`,
        prompt: `Write a comprehensive responsible gambling article (500-700 words) for Kenyan sports bettors. Include:
- Setting betting budgets and sticking to them
- Recognizing signs of problem gambling
- Tips for maintaining healthy betting habits
- Resources for gambling addiction help in Kenya
- Legal betting age (18+) reminders
Format professionally with headers and bullet points. End with helpline numbers.`,
      },
      {
        title: 'Understanding Betting Odds: A Responsible Approach',
        prompt: `Write an educational article about understanding betting odds responsibly. Cover:
- What odds really mean
- Expected value and why the house has an edge
- Why chasing losses is dangerous
- Importance of betting within your means
- How to use AI predictions responsibly (not as guarantees)
Keep it educational and promote safe gambling practices.`,
      },
      {
        title: 'Bankroll Management: Protect Your Finances',
        prompt: `Write a detailed guide on bankroll management for sports betting. Include:
- The importance of separating betting money from living expenses
- Percentage-based staking strategies
- When to take breaks
- Signs you should stop betting
- How to seek help if betting becomes a problem
Focus on financial safety and responsible behavior.`,
      },
    ];

    const selectedTopic = topics[weekNumber % topics.length];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: selectedTopic.prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const dateStr = new Date().toISOString().split('T')[0];
    const slug = `responsible-gaming-${dateStr}`;

    // Check if article already exists for today
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Responsible gaming article already exists for today',
        slug,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase
      .from('news_articles')
      .insert({
        title: selectedTopic.title,
        content: content,
        excerpt: 'Learn how to bet responsibly and protect yourself from gambling harm.',
        slug,
        category: 'Responsible Gaming',
        tags: ['responsible gambling', 'betting safety', 'bankroll management', '18+'],
        is_published: true,
        author: 'PredictPro Safety Team',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Responsible gaming article generated');

    return new Response(JSON.stringify({
      success: true,
      article: {
        title: selectedTopic.title,
        slug,
        url: `https://predictpro.guru/news/${slug}`,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating responsible gaming content:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
