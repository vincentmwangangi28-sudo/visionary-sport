export interface FooterFaqItem {
  question: string;
  answer: string;
  category?: string;
}

export const FOOTER_FAQS: FooterFaqItem[] = [
  {
    category: 'Accuracy & Model',
    question: 'How accurate are PredictPro AI football predictions today?',
    answer:
      'PredictPro achieves an 84% to 87% verified strike rate on high-confidence AI Banker selections (75%+ certainty). Our quantitative engine synthesizes Expected Goals (xG) variance, bivariate Poisson goal distribution matrices, tactical head-to-head metrics, and real-time bookmaker line movements across 40+ leagues.',
  },
  {
    category: 'BTTS AI Models',
    question: 'What is a BTTS AI prediction and how does Both Teams to Score work?',
    answer:
      'A BTTS AI prediction uses bivariate Poisson distributions to calculate the independent probability that both clubs will score at least once in 90 minutes. When combined attack ratings and defensive concession expectancies exceed 60%, the wager provides statistical positive expected value against market odds.',
  },
  {
    category: 'Value Bets (+EV)',
    question: 'How do daily value bets (+EV) beat bookmaker odds?',
    answer:
      'A value bet (+EV) occurs when our AI probability model calculates that an outcome has a higher true likelihood of happening than the implied probability of bookmaker decimal odds. By betting exclusively with a mathematical edge, punters consistently beat the Closing Line Value (CLV).',
  },
  {
    category: 'AI Pro Tips',
    question: 'What are AI Pro Tips today on PredictPro?',
    answer:
      'AI Pro Tips today are algorithmic match selections generated through Monte Carlo match simulations, incorporating player availability, Expected Goals (xG), home advantage coefficients, and sharp syndicate line movements to deliver high-probability 1X2, BTTS, and handicap forecasts.',
  },
  {
    category: 'Correct Score Models',
    question: 'How are exact Poisson scoreline probabilities calculated for correct score tips?',
    answer:
      'Exact score predictions are modeled using bivariate Poisson matrices that analyze home attack vs away defense and away attack vs home defense. The model outputs probability percentages for scores like 1-0, 2-1, 1-1, and 2-0 with verified market odds.',
  },
  {
    category: 'Banker Selections',
    question: 'What is a banker bet in football predictions?',
    answer:
      'A banker bet is the selection with the highest statistical probability of success on a given matchday, typically featuring heavy favorites with dominant underlying metrics (75%+ confidence score), strong home advantage, and high positive expected value (+EV).',
  },
  {
    category: 'League Coverage',
    question: 'Which leagues and football competitions does PredictPro cover?',
    answer:
      'We provide daily AI predictions and statistical previews for over 40 global leagues including the English Premier League (EPL), UEFA Champions League, Spanish La Liga, Italian Serie A, German Bundesliga, Kenyan Premier League (KPL), MLS, AFCON, and 17-game SportPesa & Betika Mega Jackpots.',
  },
  {
    category: 'Free vs Premium',
    question: 'Are daily football predictions on PredictPro free to access?',
    answer:
      'Yes. PredictPro provides free daily mathematical predictions, banker tips, Both Teams to Score (BTTS) odds, and over/under goal metrics for all covered fixtures without requiring payment or mandatory registration. Users can simulate custom matchups and track closing line value directly.',
  },
  {
    category: 'Live & Odds Updates',
    question: 'How frequently are match predictions and odds updated?',
    answer:
      'Predictions, Poisson probabilities, and market steam alerts are recalculated dynamically as confirmed starting lineups are announced, team injury news breaks, and bookmaker odds fluctuate throughout the matchday leading right up to kickoff.',
  },
];
