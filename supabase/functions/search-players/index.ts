import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Player {
  id: number;
  name: string;
  nationality?: string;
  position?: string;
  age?: number;
  team?: string;
  league?: string;
  photo?: string;
  rating?: number;
}

const FALLBACK_PLAYERS: Player[] = [
  { id: 1100, name: 'Erling Haaland', nationality: 'Norway', position: 'Attacker', age: 26, team: 'Manchester City', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/1100.png', rating: 8.4 },
  { id: 278, name: 'Kylian Mbappé', nationality: 'France', position: 'Attacker', age: 27, team: 'Real Madrid', league: 'La Liga', photo: 'https://media.api-sports.io/football/players/278.png', rating: 8.5 },
  { id: 645, name: 'Vinícius Júnior', nationality: 'Brazil', position: 'Attacker', age: 26, team: 'Real Madrid', league: 'La Liga', photo: 'https://media.api-sports.io/football/players/645.png', rating: 8.3 },
  { id: 306, name: 'Mohamed Salah', nationality: 'Egypt', position: 'Attacker', age: 34, team: 'Liverpool', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/306.png', rating: 8.1 },
  { id: 153, name: 'Bukayo Saka', nationality: 'England', position: 'Attacker', age: 24, team: 'Arsenal', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/153.png', rating: 8.2 },
  { id: 361730, name: 'Lamine Yamal', nationality: 'Spain', position: 'Attacker', age: 19, team: 'Barcelona', league: 'La Liga', photo: 'https://media.api-sports.io/football/players/361730.png', rating: 8.2 },
  { id: 129288, name: 'Jude Bellingham', nationality: 'England', position: 'Midfielder', age: 23, team: 'Real Madrid', league: 'La Liga', photo: 'https://media.api-sports.io/football/players/129288.png', rating: 8.4 },
  { id: 1604, name: 'Rodri', nationality: 'Spain', position: 'Midfielder', age: 30, team: 'Manchester City', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/1604.png', rating: 8.6 },
  { id: 629, name: 'Kevin De Bruyne', nationality: 'Belgium', position: 'Midfielder', age: 35, team: 'Manchester City', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/629.png', rating: 8.3 },
  { id: 184, name: 'Harry Kane', nationality: 'England', position: 'Attacker', age: 33, team: 'Bayern Munich', league: 'Bundesliga', photo: 'https://media.api-sports.io/football/players/184.png', rating: 8.5 },
  { id: 1526, name: 'Cole Palmer', nationality: 'England', position: 'Attacker', age: 24, team: 'Chelsea', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/1526.png', rating: 8.3 },
  { id: 19194, name: 'Victor Osimhen', nationality: 'Nigeria', position: 'Attacker', age: 27, team: 'Galatasaray', league: 'Süper Lig', photo: 'https://media.api-sports.io/football/players/19194.png', rating: 8.0 },
  { id: 1465, name: 'Martin Ødegaard', nationality: 'Norway', position: 'Midfielder', age: 27, team: 'Arsenal', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/1465.png', rating: 8.1 },
  { id: 293, name: 'Declan Rice', nationality: 'England', position: 'Midfielder', age: 27, team: 'Arsenal', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/293.png', rating: 8.1 },
  { id: 154, name: 'Son Heung-min', nationality: 'South Korea', position: 'Attacker', age: 34, team: 'Tottenham', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/154.png', rating: 7.9 },
  { id: 284, name: 'William Saliba', nationality: 'France', position: 'Defender', age: 25, team: 'Arsenal', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/284.png', rating: 8.2 },
  { id: 290, name: 'Virgil van Dijk', nationality: 'Netherlands', position: 'Defender', age: 35, team: 'Liverpool', league: 'Premier League', photo: 'https://media.api-sports.io/football/players/290.png', rating: 8.2 },
  { id: 157, name: 'Robert Lewandowski', nationality: 'Poland', position: 'Attacker', age: 38, team: 'Barcelona', league: 'La Liga', photo: 'https://media.api-sports.io/football/players/157.png', rating: 8.0 },
  { id: 154784, name: 'Florian Wirtz', nationality: 'Germany', position: 'Midfielder', age: 23, team: 'Bayer Leverkusen', league: 'Bundesliga', photo: 'https://media.api-sports.io/football/players/154784.png', rating: 8.3 },
  { id: 129711, name: 'Jamal Musiala', nationality: 'Germany', position: 'Midfielder', age: 23, team: 'Bayern Munich', league: 'Bundesliga', photo: 'https://media.api-sports.io/football/players/129711.png', rating: 8.4 },
  { id: 874, name: 'Michael Olunga', nationality: 'Kenya', position: 'Attacker', age: 32, team: 'Al-Duhail', league: 'Stars League', photo: 'https://media.api-sports.io/football/players/874.png', rating: 7.8 },
  { id: 854, name: 'Cristiano Ronaldo', nationality: 'Portugal', position: 'Attacker', age: 41, team: 'Al-Nassr', league: 'Saudi Pro League', photo: 'https://media.api-sports.io/football/players/854.png', rating: 8.0 },
  { id: 154, name: 'Lionel Messi', nationality: 'Argentina', position: 'Attacker', age: 39, team: 'Inter Miami', league: 'MLS', photo: 'https://media.api-sports.io/football/players/154.png', rating: 8.2 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json().catch(() => ({ query: '' }));
    const cleanQuery = (query || '').trim().toLowerCase();

    if (!cleanQuery) {
      return new Response(JSON.stringify({ players: FALLBACK_PLAYERS.slice(0, 10) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check API Sports if key available
    const apiKey = Deno.env.get('API_SPORTS_KEY') || Deno.env.get('RAPIDAPI_KEY');
    if (apiKey && cleanQuery.length >= 3) {
      try {
        const isRapid = !Deno.env.get('API_SPORTS_KEY') && !!Deno.env.get('RAPIDAPI_KEY');
        const url = isRapid
          ? `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(cleanQuery)}`
          : `https://v3.football.api-sports.io/players?search=${encodeURIComponent(cleanQuery)}`;

        const headers: Record<string, string> = isRapid
          ? { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' }
          : { 'x-apisports-key': apiKey };

        const apiRes = await fetch(url, { headers });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData?.response && Array.isArray(apiData.response) && apiData.response.length > 0) {
            const parsed: Player[] = apiData.response.map((item: any) => {
              const p = item.player;
              const stats = item.statistics?.[0];
              return {
                id: p.id,
                name: p.name,
                nationality: p.nationality,
                position: stats?.games?.position || p.position,
                age: p.age,
                team: stats?.team?.name,
                league: stats?.league?.name,
                photo: p.photo,
                rating: stats?.games?.rating ? parseFloat(stats.games.rating) : undefined,
              };
            });
            return new Response(JSON.stringify({ players: parsed, source: 'api-sports' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (err) {
        console.warn('API Sports search failed, falling back to local DB:', err);
      }
    }

    // Filter local fallback players
    const matches = FALLBACK_PLAYERS.filter(p =>
      p.name.toLowerCase().includes(cleanQuery) ||
      p.team?.toLowerCase().includes(cleanQuery) ||
      p.nationality?.toLowerCase().includes(cleanQuery) ||
      p.league?.toLowerCase().includes(cleanQuery)
    );

    return new Response(JSON.stringify({ players: matches, source: 'verified-catalog' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ players: [], error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
