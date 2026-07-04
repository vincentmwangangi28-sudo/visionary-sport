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
    
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_TOKEN') || Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const fromDate = today.toISOString().split('T')[0];
    const toDate = nextWeek.toISOString().split('T')[0];
    console.log(`📅 Fetching matches from ${fromDate} to ${toDate}`);

    // Normalized fixture list: { id, homeTeam, awayTeam, league, matchDate }
    let fixtures: Array<{ id: string; homeTeam: string; awayTeam: string; league: string; matchDate: string }> = [];

    // 1. Try Football-Data.org first (reliable, working token)
    if (footballDataToken) {
      try {
        const fdRes = await fetch(
          `https://api.football-data.org/v4/matches?dateFrom=${fromDate}&dateTo=${toDate}&status=SCHEDULED`,
          { headers: { 'X-Auth-Token': footballDataToken } }
        );
        if (fdRes.ok) {
          const fdData = await fdRes.json();
          fixtures = (fdData.matches || []).map((m: any) => ({
            id: `fd-${m.id}`,
            homeTeam: m.homeTeam?.name ?? 'Home',
            awayTeam: m.awayTeam?.name ?? 'Away',
            league: m.competition?.name ?? 'Unknown League',
            matchDate: m.utcDate,
          }));
          console.log(`✅ Football-Data: ${fixtures.length} scheduled matches`);
        } else {
          console.error(`❌ Football-Data error: ${fdRes.status}`);
        }
      } catch (e) {
        console.error('❌ Football-Data fetch failed:', e);
      }
    }

    // 2. Fallback to API-Sports if available and Football-Data returned nothing
    if (fixtures.length === 0 && apiSportsKey) {
      try {
        const asRes = await fetch(
          `https://v3.football.api-sports.io/fixtures?from=${fromDate}&to=${toDate}&status=NS`,
          { headers: { 'x-apisports-key': apiSportsKey } }
        );
        const asData = await asRes.json();
        console.log(`📊 API-Sports status=${asRes.status} results=${asData.results ?? 0} errors=${JSON.stringify(asData.errors ?? {})}`);
        if (asData.response?.length) {
          fixtures = asData.response.map((f: any) => ({
            id: `as-${f.fixture.id}`,
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            league: f.league.name,
            matchDate: f.fixture.date,
          }));
        }
      } catch (e) {
        console.error('❌ API-Sports fetch failed:', e);
      }
    }

    if (fixtures.length === 0) {
      console.log('⚠️ No upcoming matches found from any source');
      return new Response(
        JSON.stringify({ message: 'No upcoming matches found', predictionsGenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚽ Processing ${fixtures.length} upcoming matches`);


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
