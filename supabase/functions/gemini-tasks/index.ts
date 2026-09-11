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
    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    const body = await req.json();
    const { task = 'match_analysis', payload = {} } = body;

    // Support fallback heuristic if key is not yet set in production secrets
    if (!GEMINI_KEY) {
      console.warn('[gemini-tasks] GEMINI_API_KEY is not configured. Returning fallback response.');
      const fallback = generateFallback(task, payload);
      return new Response(JSON.stringify({ success: true, simulated: true, result: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let prompt = '';
    let systemInstruction = 'You are an elite football tactical analyst and sports betting intelligence specialist.';

    if (task === 'match_analysis') {
      const { homeTeam, awayTeam, league, date, odds, form } = payload;
      systemInstruction = 'You are an elite football analyst. Provide deep tactical breakdown and probabilistic forecasts.';
      prompt = `Perform a comprehensive match breakdown for:
Match: ${homeTeam} vs ${awayTeam}
League: ${league || 'Major Football League'}
Date: ${date || new Date().toISOString().split('T')[0]}
${odds ? `Bookmaker Odds: Home: ${odds.home} | Draw: ${odds.draw} | Away: ${odds.away}` : ''}
${form ? `Form: ${homeTeam}: ${form.home || 'W-D-W'} | ${awayTeam}: ${form.away || 'D-L-W'}` : ''}

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "outcome_prediction": "Home Win" | "Draw" | "Away Win",
  "confidence_score": 50-95,
  "home_win_prob": 0-100,
  "draw_prob": 0-100,
  "away_win_prob": 0-100,
  "fair_home_odds": 1.10-15.0,
  "fair_draw_odds": 2.50-6.0,
  "fair_away_odds": 1.10-15.0,
  "projected_score": "2-1",
  "btts_verdict": "Yes" | "No",
  "btts_probability": 0-100,
  "over_under_2_5": "Over 2.5" | "Under 2.5",
  "tactical_breakdown": "3-4 concise sentences detailing tactical setup, attacking patterns, defensive vulnerabilities, and head-to-head dynamics.",
  "key_player_matchup": "Key duel to watch (e.g., Striker vs Center-back) and why it dictates the match flow.",
  "expected_value_edge": "+EV / Neutral / Caution with reasoning",
  "recommended_bet": "Specific betting market with best risk-to-reward ratio"
}`;
    } else if (task === 'curate_acca') {
      const { matches = [], strategy = 'banker' } = payload;
      prompt = `You are an expert accumulator builder. From these fixtures, select the best 3 to 5 picks for a ${strategy} accumulator.
Fixtures:
${JSON.stringify(matches, null, 2)}

Strategy: ${strategy} (options: 'banker' for safe high probability, 'value' for high EV picks, 'goals' for Over/BTTS)

Respond ONLY with valid JSON:
{
  "acca_title": "AI ${strategy.toUpperCase()} ACCUMULATOR",
  "combined_odds": 3.45,
  "combined_confidence": 78,
  "rationale": "High level strategy explanation in 2 sentences",
  "legs": [
    {
      "match": "Team A vs Team B",
      "league": "League",
      "market": "Home Win / Over 1.5 / BTTS Yes",
      "odds": 1.45,
      "confidence": 85,
      "reason": "1-sentence why this leg is solid"
    }
  ]
}`;
    } else if (task === 'value_screener') {
      const { match, bookmakerOdds, marketProbabilities } = payload;
      prompt = `Analyze value betting edge for:
Match: ${JSON.stringify(match)}
Bookmaker Odds: ${JSON.stringify(bookmakerOdds)}
Model Probabilities: ${JSON.stringify(marketProbabilities)}

Respond ONLY with valid JSON:
{
  "has_positive_ev": true | false,
  "ev_percentage": 5.8,
  "recommended_market": "Home Win",
  "market_price": 2.10,
  "fair_price": 1.85,
  "kelly_stake_percent": 2.5,
  "verdict": "Strong Value" | "Marginal Edge" | "Avoid",
  "analysis": "2 sentence explanation of the market inefficiency"
}`;
    } else if (task === 'generate_telegram_post') {
      const { type = 'banker', data = {} } = payload;
      prompt = `Create an engaging, beautifully formatted Telegram channel post formatted with HTML tags (<b>, <i>, <u>, <code>).
Type: ${type}
Details: ${JSON.stringify(data)}

Include relevant football emojis (⚽, 🎯, 🔥, 💎, 📈), bold match titles, odds, confidence rating, 2-sentence breakdown, call-to-action link to https://predictpro.guru, and responsible gambling reminder.

Respond ONLY with valid JSON:
{
  "html_post": "formatted text string with HTML tags",
  "headline": "Short preview headline"
}`;
    } else if (task === 'live_momentum') {
      const { match, minute, score, league, events = [] } = payload;
      systemInstruction = 'You are a real-time football in-play momentum analyst, interpreting game phase, xG trajectory, and in-play market angles.';
      prompt = `Evaluate live in-play momentum for:
Match: ${JSON.stringify(match)}
Current Status: ${minute ? `${minute}'` : 'Live In-Play'}
Current Score: ${score || '0 - 0'}
League: ${league || 'Major Competition'}
Recent Events / Context: ${JSON.stringify(events)}

Respond ONLY with valid JSON:
{
  "game_phase": "High Press Siege" | "End-to-End Counter" | "Midfield Lockdown" | "Late Comeback Push",
  "momentum_team": "Home" | "Away" | "Neutral",
  "pressure_index": 72,
  "inplay_tip": "Next Goal Team / Over Total / Draw",
  "confidence": 75,
  "tactical_pulse": "2 concise sentences explaining live flow and why the in-play angle has mathematical weight.",
  "projected_final_score": "2 - 1"
}`;
    } else if (task === 'daily_digest') {
      const { date, matches = [] } = payload;
      systemInstruction = 'You are an elite sports betting editor and tactical quantitative analyst, creating high-converting, accurate daily football betting digests.';
      prompt = `Create a daily football matchday intelligence digest for date: ${date || 'Today'}.
Top Fixtures Available:
${JSON.stringify(matches.slice(0, 10))}

Respond ONLY with valid JSON:
{
  "headline": "Punchy 1-line headline summarizing today's action",
  "summary": "2-3 concise sentences detailing overall tactical value and market efficiency gaps today",
  "marketPulse": {
    "totalMatchesAnalyzed": 38,
    "avgConfidence": 81,
    "bestValueLeague": "Premier League"
  },
  "topPicks": [
    {
      "type": "banker",
      "title": "Category title (e.g., Primary Banker Lock)",
      "badge": "Short badge tag (e.g., 88% Conf)",
      "match": "Team A vs Team B",
      "league": "Competition name",
      "pick": "Specific market (e.g., Home Win & Over 1.5)",
      "odds": 1.45,
      "confidence": 85,
      "tacticalAngle": "2 sentences of statistical or tactical reasoning"
    }
  ]
}`;
    } else if (task === 'match_qa') {
      const { question, matchContext } = payload;
      systemInstruction = 'You are PredictPro Scout, a master football analyst and sports betting intelligence assistant.';
      prompt = `User Question: "${question}"
Match Context: ${JSON.stringify(matchContext || {})}
Provide an analytical, data-backed answer (max 150 words). Include tactical rationale, expected goals (xG) context, and risk warnings if applicable.`;
    } else if (task === 'football_news') {
      const { headlines = [], league = 'All' } = payload;
      systemInstruction = 'You are a senior sports editor and football data analyst for PredictPro. Generate high-impact tactical news reports and betting analysis for major football leagues.';
      prompt = `Synthesize today's major football news and tactical betting wire (League focus: ${league}).
Contextual headlines: ${JSON.stringify(headlines.slice(0, 8))}

Respond ONLY with a valid JSON array of 5 news items:
[
  {
    "title": "Impactful headline (e.g., Arsenal Tactical Shift: Saka Role Adjustment Creates High-Value Assist Angles)",
    "description": "2 sentences of analytical context explaining the tactical or squad development.",
    "category": "Tactical Wire", // Options: "Tactical Wire", "Injury Alert", "Transfer News", "Market Movement", "Match Preview"
    "bettingImpact": "Explicit betting angle or expected market movement (e.g., Odds shortening on Over 2.5 team goals; key winger absence increases opponent clean sheet value)",
    "source": "Gemini AI Tactical Wire",
    "region": "Europe",
    "link": "https://predictpro.guru/news",
    "pubDate": "${new Date().toISOString()}",
    "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
  }
]`;
    } else if (task === 'viral_keywords') {
      const { niche = 'football betting tips ai predictions', seedQueries = [] } = payload;
      systemInstruction = 'You are an elite SEO strategist and sports betting data scientist. Discover trending, breakout, high-intent football prediction search queries using Google Search.';
      prompt = `Using Google Search Grounding, discover the current top viral and breakout search queries ranking high in Google for: "${niche}".
Seed queries from Google Search Console: ${JSON.stringify(seedQueries.slice(0, 10))}

Identify high-CTR breakout queries across:
1. Both Teams To Score (BTTS) AI predictions
2. AI Pro Tips & Guru Football Predictions
3. Banker / Sure Win Daily Accas
4. Premier League & Champions League Matchday queries
5. Emerging international trends (e.g. AFCON, KPL, US/MLS)

Respond ONLY with valid JSON:
{
  "scannedAt": "${new Date().toISOString()}",
  "topViralKeywords": [
    {
      "keyword": "btts ai prediction today",
      "searchIntent": "Commercial",
      "targetUrl": "/btts",
      "estimatedMonthlySearches": 180000,
      "competitiveDifficulty": "Medium",
      "whyViral": "Explosive growth from punters demanding goal-market probability engines.",
      "recommendedTitle": "Both Teams to Score (BTTS) AI Predictions Today | PredictPro"
    }
  ],
  "breakoutOpportunities": [
    {
      "topic": "Both Teams To Score AI Hub",
      "opportunityType": "CTR Surge",
      "action": "Add FAQ schema and exact-match H1 to /btts to leap from page 5 to page 1",
      "priority": "High"
    }
  ],
  "serpGroundingSummary": "Google SERPs show increasing demand for real-time statistical algorithms vs static tips."
}`;
    } else {
      prompt = `Answer the following sports betting and tactical football query: ${JSON.stringify(payload)}`;
    }

    const requestBody: any = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
      },
    };

    // Add Google Search Grounding for viral keywords and real-time news tasks
    if (task === 'viral_keywords' || task === 'football_news') {
      requestBody.tools = [{ googleSearch: {} }];
    }

    const modelName = task === 'viral_keywords' ? 'gemini-flash-latest' : 'gemini-flash-latest';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[gemini-tasks] Gemini API error:', res.status, data);
      const fallback = generateFallback(task, payload);
      return new Response(JSON.stringify({ success: true, fallback_used: true, result: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        parsed = { raw: rawText };
      }
    } else {
      parsed = { raw: rawText };
    }

    return new Response(JSON.stringify({ success: true, result: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallback(task: string, payload: any) {
  if (task === 'match_analysis') {
    const home = payload.homeTeam || 'Arsenal';
    const away = payload.awayTeam || 'Chelsea';
    return {
      outcome_prediction: 'Home Win',
      confidence_score: 74,
      home_win_prob: 54,
      draw_prob: 26,
      away_win_prob: 20,
      fair_home_odds: 1.85,
      fair_draw_odds: 3.40,
      fair_away_odds: 4.50,
      projected_score: '2-1',
      btts_verdict: 'Yes',
      btts_probability: 62,
      over_under_2_5: 'Over 2.5',
      tactical_breakdown: `${home} demonstrates high pressing intensity at home with superior midfield transition speed, while ${away} relies on low-block counter attacks. Expect ${home} to control territory and create high-probability chances.`,
      key_player_matchup: `Attacking playmaker vs Central Defensive Midfielder will dictate space between lines.`,
      expected_value_edge: '+EV detected on Home Win and Over 2.5 combined markets.',
      recommended_bet: `${home} to Win or Over 2.5 Goals`,
    };
  }

  if (task === 'curate_acca') {
    return {
      acca_title: 'AI BANKER ACCUMULATOR',
      combined_odds: 3.65,
      combined_confidence: 81,
      rationale: 'Balanced 3-fold accumulator combining strong home dominance and consistent goal patterns.',
      legs: [
        { match: 'Arsenal vs Wolves', league: 'Premier League', market: 'Home Win', odds: 1.35, confidence: 88, reason: 'Strong home record and pressing dominance' },
        { match: 'Real Madrid vs Getafe', league: 'La Liga', market: 'Home Win & Over 1.5', odds: 1.45, confidence: 84, reason: 'High offensive output against defensive low blocks' },
        { match: 'Bayern Munich vs Hoffenheim', league: 'Bundesliga', market: 'Over 2.5 Goals', odds: 1.40, confidence: 80, reason: 'Both teams averaging > 3.2 expected goals per game' },
      ],
    };
  }

  if (task === 'value_screener') {
    return {
      has_positive_ev: true,
      ev_percentage: 6.4,
      recommended_market: 'Home Win',
      market_price: 2.15,
      fair_price: 1.90,
      kelly_stake_percent: 2.5,
      verdict: 'Strong Value',
      analysis: 'Market is pricing home side below their true expected conversion rate given recent underlying xG numbers.',
    };
  }

  if (task === 'generate_telegram_post') {
    return {
      headline: '🎯 PredictPro Daily Banker Bet',
      html_post: `🎯 <b>PREDICTPRO AI — BANKER OF THE DAY</b> 🎯\n\n⚽ <b>Arsenal vs Chelsea</b>\n🏆 <i>Premier League</i>\n📊 <b>Pick:</b> Home Win\n💰 <b>Odds:</b> 1.85\n🔥 <b>AI Confidence:</b> 78%\n\n🧠 <b>AI Analysis:</b>\nArsenal's home xG of 2.15 provides significant mathematical value against Chelsea's transition defense.\n\n⚡ <i>Powered by PredictPro Gemini AI</i>\n🔗 Track live: https://predictpro.guru`,
    };
  }

  if (task === 'live_momentum') {
    const match = payload.match || 'Match';
    const score = payload.score || '0 - 0';
    return {
      game_phase: 'High Press Siege',
      momentum_team: 'Home',
      pressure_index: 78,
      inplay_tip: 'Next Goal: Home Team',
      confidence: 76,
      tactical_pulse: `Sustained final-third territory and consecutive corner deliveries indicate high probability of an imminent breakthrough for the leading attacking side.`,
      projected_final_score: score.startsWith('0') ? '1 - 0' : '2 - 1',
    };
  }

  if (task === 'daily_digest') {
    return {
      headline: 'Matchday Intelligence: Key AI Angles for Today',
      summary: 'Gemini analytical models spotlight significant xG conversion edge in home fixtures across the Premier League and La Liga.',
      marketPulse: {
        totalMatchesAnalyzed: 42,
        avgConfidence: 81,
        bestValueLeague: 'Premier League',
      },
      topPicks: [
        {
          type: 'banker',
          title: 'Primary Banker Lock',
          badge: '88% Conf',
          match: 'Arsenal vs Chelsea',
          league: 'Premier League',
          pick: 'Home Win',
          odds: 1.85,
          confidence: 88,
          tacticalAngle: 'High pressing efficiency and superior box occupancy gives home side commanding statistical edge.',
        },
        {
          type: 'value',
          title: '+EV Tactical Edge',
          badge: 'Value 7.2%',
          match: 'Real Madrid vs Barcelona',
          league: 'La Liga',
          pick: 'Over 2.5 Goals',
          odds: 1.92,
          confidence: 82,
          tacticalAngle: 'Both attacks operating above 2.4 expected goals per game, exploiting transition half-spaces.',
        },
      ],
    };
  }

  if (task === 'match_qa') {
    return {
      reply: 'Based on current xG metrics and historical direct encounters, the home side holds a 64% win probability. Key tactical factor is ball retention in the opponent final third and defensive transitions.',
    };
  }

  if (task === 'football_news') {
    return {
      news: [
        {
          title: "Premier League High-Press Overhauls: Transition Vulnerabilities Point to Both Teams to Score Value",
          description: "High defensive lines across top table contenders are conceding increased counter-pressing xG in matchweeks.",
          category: "Tactical Wire",
          bettingImpact: "Significant value identified on BTTS (Both Teams To Score) across Saturday fixtures averaging 1.78 odds.",
          source: "Gemini AI Tactical Wire",
          region: "Europe",
          link: "https://predictpro.guru/news",
          pubDate: new Date().toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
        },
        {
          title: "Champions League Tactical Review: Fullback Inversions Shift Corner and Cross Distributions",
          description: "Tactical restructuring in wide areas has reduced traditional byline crossing, directly affecting match corner totals.",
          category: "Market Movement",
          bettingImpact: "Under 10.5 total match corners trading at positive statistical expected value based on revised tactical distributions.",
          source: "Gemini AI Tactical Wire",
          region: "Europe",
          link: "https://predictpro.guru/news",
          pubDate: new Date().toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80"
        },
        {
          title: "Squad Depth & Fatigue Index: Midweek European Fixture Rotations Cause Line Value Discrepancies",
          description: "Dense schedules create key rotation spots for favorites playing away, tightening fair price mathematical lines.",
          category: "Injury Alert",
          bettingImpact: "Opponent Asian Handicap +1.5 offers calculated statistical resilience against fatigued favorites.",
          source: "Gemini AI Tactical Wire",
          region: "Global",
          link: "https://predictpro.guru/news",
          pubDate: new Date().toISOString(),
          imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80"
        }
      ]
    };
  }

  if (task === 'viral_keywords') {
    return {
      scannedAt: new Date().toISOString(),
      topViralKeywords: [
        {
          keyword: 'btts ai prediction today',
          searchIntent: 'Commercial',
          targetUrl: '/btts',
          estimatedMonthlySearches: 180000,
          competitiveDifficulty: 'Medium',
          whyViral: 'High CTR intent (55.56% CTR in GSC). High punter demand for algorithmic goal-market models.',
          recommendedTitle: 'Both Teams To Score (BTTS) AI Predictions Today | PredictPro',
        },
        {
          keyword: 'aiprotips prediction today',
          searchIntent: 'Informational',
          targetUrl: '/predict',
          estimatedMonthlySearches: 285000,
          competitiveDifficulty: 'Medium',
          whyViral: 'Massive impressions volume (284 impressions in GSC report). High conversion opportunity if ranking moves to page 1.',
          recommendedTitle: 'AI Pro Tips Today: Match Winner & BTTS Predictions | PredictPro',
        },
        {
          keyword: 'free guru tips today football prediction',
          searchIntent: 'Commercial',
          targetUrl: '/best-bets',
          estimatedMonthlySearches: 120000,
          competitiveDifficulty: 'Low',
          whyViral: '60% CTR in GSC report at position 6.8. Dominates search intent in East & West Africa (Kenya, Nigeria, Uganda).',
          recommendedTitle: 'Free Guru Tips Today & Sure Wins Football Predictions | PredictPro',
        },
        {
          keyword: 'gemini ai football predictions',
          searchIntent: 'Informational',
          targetUrl: '/predict',
          estimatedMonthlySearches: 95000,
          competitiveDifficulty: 'Low',
          whyViral: 'Direct brand affinity query ranking at position 4. Punters specifically seek Gemini-powered sports models.',
          recommendedTitle: 'Gemini AI Football Predictions: Machine Learning Match Forecaster | PredictPro',
        },
        {
          keyword: 'guru tips correct score today',
          searchIntent: 'Commercial',
          targetUrl: '/correct-score',
          estimatedMonthlySearches: 85000,
          competitiveDifficulty: 'Medium',
          whyViral: 'Position 7 in GSC report with strong commercial conversion to premium subscribers.',
          recommendedTitle: 'Correct Score Guru Tips Today: Algorithmic Scorelines | PredictPro',
        },
        {
          keyword: 'daily value bets today (+ev)',
          searchIntent: 'Transactional',
          targetUrl: '/value-bets',
          estimatedMonthlySearches: 65000,
          competitiveDifficulty: 'Low',
          whyViral: 'Position 4.33 in GSC report with 104 impressions. Meta title optimization unlocks immediate CTR jump.',
          recommendedTitle: 'Daily Value Bets Today (+EV): Beat Bookmakers With AI Odds | PredictPro',
        },
      ],
      breakoutOpportunities: [
        {
          topic: 'Both Teams To Score (BTTS) Page 1 Leap',
          opportunityType: 'High-CTR Outlier',
          action: 'Target /btts with exact-match H1 and FAQ Schema. Current CTR is 40.85% at position 77; moving to Page 1 will 10x traffic.',
          priority: 'Critical',
        },
        {
          topic: 'AI Pro Tips Today Low-CTR Capture',
          opportunityType: 'High-Impression Harvest',
          action: 'Page has 284 impressions on pos 28 with 0.35% CTR. Update meta title to include "AI Pro Tips Today" to capture 30+ clicks daily.',
          priority: 'High',
        },
        {
          topic: 'Page 1 Inefficiency on Value Bets and Live Scores',
          opportunityType: 'SERP CTR Inefficiency',
          action: '/value-bets and /live rank at pos 4.33 with 104 impressions each but 0 clicks. Add urgent action-oriented titles and rich schemas.',
          priority: 'High',
        },
        {
          topic: 'United States Traffic Expansion',
          opportunityType: 'Untapped Geo Market',
          action: 'US has 616 impressions with 0 clicks at pos 16.95. Highlight Premier League & Champions League soccer predictions tailored for US punters.',
          priority: 'Medium',
        },
      ],
      serpGroundingSummary: 'Grounded Google SERP analysis identifies that Both Teams to Score (BTTS) and Guru/AI Tips are the highest-converting sub-niches. Technical FAQ schema and immediate meta tag alignment will capture top SERP positions.',
    };
  }

  return { message: 'Processed successfully', payload };
}
