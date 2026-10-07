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
    category: 'xG Methodology',
    question: 'What is an Expected Goals (xG) football model and how does it predict outcomes?',
    answer:
      'Expected Goals (xG) measures the statistical quality of goal-scoring opportunities created and conceded based on shot trajectory, assist angle, defender positioning, and historical conversion rates. PredictPro simulates 10,000 match scorelines using Poisson distributions to determine true mathematical probabilities for 1X2 Match Winner, Both Teams to Score (BTTS), and Over/Under 2.5 goals.',
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
