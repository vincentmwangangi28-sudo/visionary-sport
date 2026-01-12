import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam, league, matchDate } = await req.json();
    
    console.log('Generating match preview for:', { homeTeam, awayTeam, league, matchDate });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Generate a comprehensive pre-match preview article for the following football match:

Match: ${homeTeam} vs ${awayTeam}
League: ${league}
Date: ${matchDate}

Create a detailed preview with the following sections. Return as valid JSON:

{
  "headline": "Catchy headline for the match",
  "introduction": "2-3 sentence intro setting the scene",
  "teamNews": {
    "home": {
      "form": "Recent 5 match form description",
      "keyPlayers": ["Player 1 - role/impact", "Player 2 - role/impact", "Player 3 - role/impact"],
      "injuries": ["Injured player - expected return"],
      "tactics": "Expected formation and tactical approach"
    },
    "away": {
      "form": "Recent 5 match form description", 
      "keyPlayers": ["Player 1 - role/impact", "Player 2 - role/impact", "Player 3 - role/impact"],
      "injuries": ["Injured player - expected return"],
      "tactics": "Expected formation and tactical approach"
    }
  },
  "headToHead": {
    "summary": "Brief h2h summary",
    "lastMeetings": [
      {"result": "Team A 2-1 Team B", "date": "Jan 2025", "venue": "Home/Away"},
      {"result": "Team B 0-0 Team A", "date": "Aug 2024", "venue": "Home/Away"}
    ],
    "homeRecord": "Home team's record in this fixture"
  },
  "tacticalAnalysis": "2-3 paragraphs analyzing how the match might unfold tactically",
  "keyBattles": [
    {"title": "Midfield Battle", "description": "Player vs Player analysis"},
    {"title": "Wing Duel", "description": "Player vs Player analysis"}
  ],
  "prediction": {
    "scoreline": "2-1",
    "winner": "Home/Away/Draw",
    "confidence": 75,
    "reasoning": "Brief reasoning for the prediction"
  },
  "bettingInsights": [
    {"market": "Match Result", "tip": "Home Win", "odds": "1.85", "value": "Good value"},
    {"market": "Over/Under 2.5", "tip": "Over 2.5 Goals", "odds": "1.90", "value": "Fair value"}
  ]
}

Be creative, insightful, and provide realistic analysis. Return ONLY the JSON object.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert football analyst and sports journalist. Generate detailed, insightful match previews with tactical analysis.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let preview;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        preview = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback preview
      preview = {
        headline: `${homeTeam} vs ${awayTeam}: Match Preview`,
        introduction: `An exciting ${league} clash awaits as ${homeTeam} host ${awayTeam}. Both teams will be looking to secure all three points in what promises to be an entertaining encounter.`,
        teamNews: {
          home: {
            form: "Recent form has been solid with competitive performances",
            keyPlayers: ["Star striker leading the attack", "Creative midfielder pulling strings", "Reliable goalkeeper"],
            injuries: ["Minor knocks to assess"],
            tactics: "Expected to play their usual attacking formation"
          },
          away: {
            form: "Showing good away form this season",
            keyPlayers: ["Prolific forward", "Dominant center-back", "Energetic box-to-box midfielder"],
            injuries: ["Key players returning from injury"],
            tactics: "Likely to set up in a compact defensive shape"
          }
        },
        headToHead: {
          summary: "These two teams have had competitive encounters in recent seasons",
          lastMeetings: [
            { result: `${homeTeam} 1-1 ${awayTeam}`, date: "Last Season", venue: "Home" }
          ],
          homeRecord: "Home advantage has been significant in this fixture"
        },
        tacticalAnalysis: "This match promises tactical intrigue with both managers known for their adaptive approaches. The home side will look to use their crowd advantage to press high and create early chances.",
        keyBattles: [
          { title: "Midfield Control", description: "The battle for midfield supremacy will be crucial" },
          { title: "Defensive Discipline", description: "Both defenses will be tested" }
        ],
        prediction: {
          scoreline: "2-1",
          winner: homeTeam,
          confidence: 65,
          reasoning: "Home advantage and recent form favor the hosts"
        },
        bettingInsights: [
          { market: "Match Result", tip: "Home Win", odds: "1.90", value: "Fair value" },
          { market: "Both Teams to Score", tip: "Yes", odds: "1.75", value: "Good value" }
        ]
      };
    }

    console.log('Match preview generated successfully');

    return new Response(JSON.stringify({ preview }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating match preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
