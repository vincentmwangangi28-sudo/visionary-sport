import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!apiSportsKey || !lovableApiKey) {
      throw new Error('Required API keys not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('⏰ Running scheduled predictions automation...');

    // Get current time in EAT (East Africa Time = UTC+3)
    const now = new Date();
    const eatHour = (now.getUTCHours() + 3) % 24;
    
    console.log(`Current EAT hour: ${eatHour}`);

    // Schedule times (EAT):
    // 08:00 - Morning predictions for day matches
    // 14:00 - Afternoon update for evening matches
    // 20:00 - Night update for late matches
    
    const schedules = [
      { hour: 8, type: 'morning', description: 'Morning predictions batch' },
      { hour: 14, type: 'afternoon', description: 'Afternoon predictions update' },
      { hour: 20, type: 'evening', description: 'Evening predictions batch' }
    ];

    const currentSchedule = schedules.find(s => s.hour === eatHour);
    
    if (!currentSchedule) {
      console.log('Not a scheduled time, skipping...');
      return new Response(
        JSON.stringify({ success: true, message: 'Not a scheduled time', currentHour: eatHour }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🕐 Running ${currentSchedule.description}...`);

    // Determine date range based on schedule type
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let fromDate = today.toISOString().split('T')[0];
    let toDate = tomorrow.toISOString().split('T')[0];
    
    if (currentSchedule.type === 'evening') {
      // Evening batch focuses on next day
      fromDate = tomorrow.toISOString().split('T')[0];
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      toDate = dayAfter.toISOString().split('T')[0];
    }

    // Fetch upcoming matches
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?from=${fromDate}&to=${toDate}&league=39,140,78,135,61`,
      {
        headers: { 'x-apisports-key': apiSportsKey }
      }
    );

    const data = await response.json();
    const fixtures = data.response || [];
    
    console.log(`⚽ Found ${fixtures.length} fixtures for ${currentSchedule.type} batch`);

    let predictionsGenerated = 0;
    const errors: string[] = [];

    for (const fixture of fixtures.slice(0, 15)) { // Limit per batch
      try {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const league = fixture.league.name;
        const matchDate = fixture.fixture.date;
        const matchId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${matchDate.split('T')[0]}`;

        // Check if prediction exists
        const { data: existing } = await supabase
          .from('predictions')
          .select('id')
          .eq('match_id', matchId)
          .single();

        if (existing) {
          console.log(`⏭️ Skipping ${homeTeam} vs ${awayTeam} - exists`);
          continue;
        }

        // Generate AI prediction
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert football analyst. Provide predictions in format: Prediction: [Home Win/Away Win/Draw], Confidence: [50-95], Reasoning: [brief explanation]' 
              },
              { 
                role: 'user', 
                content: `Analyze: ${homeTeam} vs ${awayTeam} in ${league} on ${new Date(matchDate).toLocaleDateString()}` 
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          errors.push(`AI error for ${homeTeam} vs ${awayTeam}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;

        const predictionMatch = content.match(/Prediction:\s*\[?(Home Win|Away Win|Draw)\]?/i);
        const confidenceMatch = content.match(/Confidence:\s*\[?(\d+)\]?/i);
        const reasoningMatch = content.match(/Reasoning:\s*\[?([\s\S]+?)(?:\n|$)/i);

        await supabase.from('predictions').insert({
          match_id: matchId,
          home_team: homeTeam,
          away_team: awayTeam,
          league: league,
          match_date: matchDate,
          prediction: predictionMatch ? predictionMatch[1] : 'Draw',
          confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 65,
          reasoning: reasoningMatch ? reasoningMatch[1].trim() : content.substring(0, 200),
          ai_model: 'google/gemini-3-flash-preview',
          is_premium: false
        });

        predictionsGenerated++;
        console.log(`✅ Generated: ${homeTeam} vs ${awayTeam}`);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(msg);
      }
    }

    console.log(`⏰ ${currentSchedule.type} batch complete: ${predictionsGenerated} predictions`);

    return new Response(
      JSON.stringify({
        success: true,
        schedule: currentSchedule,
        predictionsGenerated,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduled predictions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
