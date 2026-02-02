// Team logo utility - fetches logos from reliable free sources
// Uses ESPN's logo CDN which is fast and comprehensive

export const getTeamLogoUrl = (teamName: string): string => {
  const normalizedName = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  // Map common team names to their logo IDs (ESPN format)
  const teamLogoMap: Record<string, string> = {
    // Premier League
    'arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    'manchester-united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
    'manchester-city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    'liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
    'chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
    'tottenham-hotspur': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
    'tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
    'newcastle-united': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
    'aston-villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
    'brighton': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
    'west-ham-united': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
    'west-ham': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
    'everton': 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
    'wolves': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    'wolverhampton': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
    'crystal-palace': 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
    'brentford': 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png',
    'fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
    'nottingham-forest': 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
    'bournemouth': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
    'burnley': 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png',
    'burnley-fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png',
    'sunderland': 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
    'sunderland-afc': 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
    'sheffield-united': 'https://a.espncdn.com/i/teamlogos/soccer/500/398.png',
    'luton': 'https://a.espncdn.com/i/teamlogos/soccer/500/301.png',
    
    // La Liga
    'real-madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    'real-madrid-cf': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    'barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    'fc-barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    'atletico-madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
    'atletico-de-madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
    'real-sociedad': 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',
    'real-betis': 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
    'villarreal': 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',
    'athletic-bilbao': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
    'sevilla': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
    'sevilla-fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
    'valencia': 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
    'mallorca': 'https://a.espncdn.com/i/teamlogos/soccer/500/3751.png',
    'rcd-mallorca': 'https://a.espncdn.com/i/teamlogos/soccer/500/3751.png',
    'rayo-vallecano': 'https://a.espncdn.com/i/teamlogos/soccer/500/2077.png',
    'getafe': 'https://a.espncdn.com/i/teamlogos/soccer/500/3741.png',
    'osasuna': 'https://a.espncdn.com/i/teamlogos/soccer/500/97.png',
    'celta-vigo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3747.png',
    
    // Serie A
    'juventus': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
    'inter': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    'inter-milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    'ac-milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
    'milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
    'napoli': 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
    'roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    'as-roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
    'lazio': 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png',
    'atalanta': 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',
    'fiorentina': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
    'udinese': 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',
    'udinese-calcio': 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',
    'torino': 'https://a.espncdn.com/i/teamlogos/soccer/500/116.png',
    'torino-fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/116.png',
    'bologna': 'https://a.espncdn.com/i/teamlogos/soccer/500/108.png',
    'sassuolo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3175.png',
    'lecce': 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',
    'us-lecce': 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',
    
    // Bundesliga
    'bayern-munich': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    'bayern-munchen': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    'borussia-dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
    'dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
    'rb-leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
    'leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
    'bayer-leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    'leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    'eintracht-frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
    'wolfsburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/129.png',
    'freiburg': 'https://a.espncdn.com/i/teamlogos/soccer/500/3604.png',
    'hoffenheim': 'https://a.espncdn.com/i/teamlogos/soccer/500/3261.png',
    'mainz': 'https://a.espncdn.com/i/teamlogos/soccer/500/3611.png',
    'koln': 'https://a.espncdn.com/i/teamlogos/soccer/500/3609.png',
    'cologne': 'https://a.espncdn.com/i/teamlogos/soccer/500/3609.png',
    'union-berlin': 'https://a.espncdn.com/i/teamlogos/soccer/500/6093.png',
    'stuttgart': 'https://a.espncdn.com/i/teamlogos/soccer/500/134.png',
    'werder-bremen': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    'bremen': 'https://a.espncdn.com/i/teamlogos/soccer/500/133.png',
    
    // Ligue 1
    'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
    'paris-saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
    'marseille': 'https://a.espncdn.com/i/teamlogos/soccer/500/176.png',
    'olympique-marseille': 'https://a.espncdn.com/i/teamlogos/soccer/500/176.png',
    'lyon': 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',
    'olympique-lyon': 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',
    'monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
    'as-monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
    'lille': 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
    'nice': 'https://a.espncdn.com/i/teamlogos/soccer/500/178.png',
    'lens': 'https://a.espncdn.com/i/teamlogos/soccer/500/3784.png',
    'rennes': 'https://a.espncdn.com/i/teamlogos/soccer/500/177.png',
    
    // Portuguese Liga
    'porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
    'fc-porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
    'benfica': 'https://a.espncdn.com/i/teamlogos/soccer/500/213.png',
    'sl-benfica': 'https://a.espncdn.com/i/teamlogos/soccer/500/213.png',
    'sporting': 'https://a.espncdn.com/i/teamlogos/soccer/500/439.png',
    'sporting-cp': 'https://a.espncdn.com/i/teamlogos/soccer/500/439.png',
    'sporting-lisbon': 'https://a.espncdn.com/i/teamlogos/soccer/500/439.png',
    'braga': 'https://a.espncdn.com/i/teamlogos/soccer/500/435.png',
    'sporting-clube-de-braga': 'https://a.espncdn.com/i/teamlogos/soccer/500/435.png',
    'casa-pia': 'https://a.espncdn.com/i/teamlogos/soccer/500/20872.png',
    'casa-pia-ac': 'https://a.espncdn.com/i/teamlogos/soccer/500/20872.png',
    'avs': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    
    // Eredivisie
    'ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
    'afc-ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
    'psv': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
    'psv-eindhoven': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
    'feyenoord': 'https://a.espncdn.com/i/teamlogos/soccer/500/143.png',
    'feyenoord-rotterdam': 'https://a.espncdn.com/i/teamlogos/soccer/500/143.png',
    
    // Champions League
    'champions-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    
    // Kenya Premier League
    'gor-mahia': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    'gor-mahia-fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    'afc-leopards': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    'tusker': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    
    // Default
    'default': 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png'
  };
  
  return teamLogoMap[normalizedName] || teamLogoMap['default'];
};

export const getLeagueLogoUrl = (leagueName: string): string => {
  const normalizedName = leagueName.toLowerCase().replace(/\s+/g, '-');
  
  const leagueLogoMap: Record<string, string> = {
    'premier-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    'la-liga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    'primera-division': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    'serie-a': 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    'bundesliga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    'ligue-1': 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
    'champions-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    'europa-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png',
    'eredivisie': 'https://a.espncdn.com/i/leaguelogos/soccer/500/11.png',
    'primeira-liga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
    'kenya-premier-league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/default-league-logo.png',
    'default': 'https://a.espncdn.com/i/leaguelogos/soccer/500/default-league-logo.png'
  };
  
  return leagueLogoMap[normalizedName] || leagueLogoMap['default'];
};
