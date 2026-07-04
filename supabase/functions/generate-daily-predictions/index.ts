import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Starting daily prediction generation...');
    
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiSportsKey) {
      throw new Error('API_SPORTS_KEY not configured');
    }
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch upcoming matches from API-Sports (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = nextWeek.toISOString().split('T')[0];
    
    console.log(`📅 Fetching matches from ${fromDate} to ${toDate}`);
    
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?from=${fromDate}&to=${toDate}&status=NS`,
      {
        headers: {
          'x-apisports-key': apiSportsKey
        }
      }
    );

    const data = await response.json();
    console.log(`📊 API-Sports status=${response.status} results=${data.results ?? 0} errors=${JSON.stringify(data.errors ?? {})}`);
    
    if (!data.response || data.response.length === 0) {
      console.log('⚠️ No upcoming matches found');
      return new Response(
        JSON.stringify({ message: 'No upcoming matches found', predictionsGenerated: 0, apiErrors: data.errors ?? null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚽ Found ${data.response.length} upcoming matches`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let predictionsGenerated = 0;
    const errors: string[] = [];

    // Generate predictions for each match
    for (const fixture of data.response.slice(0, 20)) { // Limit to 20 matches to avoid rate limits
      try {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const league = fixture.league.name;
        const matchDate = fixture.fixture.date;
        const matchId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${matchDate.split('T')[0]}`;

        // Check if prediction already exists
        const { data: existingPrediction } = await supabase
          .from('predictions')
          .select('id')
          .eq('match_id', matchId)
          .single();

        if (existingPrediction) {
          console.log(`⏭️ Skipping ${homeTeam} vs ${awayTeam} - prediction already exists`);
          continue;
        }

        // Prepare AI prompt with match context
        const systemPrompt = `You are an expert football analyst specializing in match predictions. Analyze the upcoming match and provide a prediction based on current form, historical data, and tactical considerations.`;
        
        const userPrompt = `Analyze this upcoming match and provide a prediction:
        
Home Team: ${homeTeam}
Away Team: ${awayTeam}
League: ${league}
Match Date: ${new Date(matchDate).toLocaleDateString()}

Provide your analysis in the following format:
1. Prediction: [Home Win/Away Win/Draw]
2. Confidence: [50-95]
3. Reasoning: [2-3 sentences explaining key factors]

Keep your response concise and focused on the most important factors.`;

        console.log(`🔮 Generating prediction for ${homeTeam} vs ${awayTeam}...`);

        // Call Lovable AI for prediction
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`❌ AI API error for ${homeTeam} vs ${awayTeam}:`, aiResponse.status, errorText);
          errors.push(`${homeTeam} vs ${awayTeam}: AI API error ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;

        // Parse AI response
        const predictionMatch = aiContent.match(/Prediction:\s*\[?(Home Win|Away Win|Draw)\]?/i);
        const confidenceMatch = aiContent.match(/Confidence:\s*\[?(\d+)\]?/i);
        const reasoningMatch = aiContent.match(/Reasoning:\s*\[?([\s\S]+?)(?:\n\n|$)/i);

        const prediction = predictionMatch ? predictionMatch[1] : 'Draw';
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 65;
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : aiContent.substring(0, 200);

        // Save to predictions table
        const { data: insertedPrediction, error: insertError } = await supabase
          .from('predictions')
          .insert({
            match_id: matchId,
            home_team: homeTeam,
            away_team: awayTeam,
            league: league,
            match_date: matchDate,
            prediction: prediction,
            confidence: confidence,
            reasoning: reasoning,
            ai_model: 'google/gemini-2.5-flash',
            is_premium: false
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Database error for ${homeTeam} vs ${awayTeam}:`, insertError);
          errors.push(`${homeTeam} vs ${awayTeam}: Database error`);
        } else {
          console.log(`✅ Prediction saved for ${homeTeam} vs ${awayTeam}`);
          predictionsGenerated++;
        }

        // Rate limit delay (avoid hitting API limits)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing match:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Match error: ${errorMsg}`);
      }
    }

    console.log(`🎯 Generated ${predictionsGenerated} predictions`);

    return new Response(
      JSON.stringify({
        success: true,
        predictionsGenerated,
        totalMatches: data.response.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-daily-predictions:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
