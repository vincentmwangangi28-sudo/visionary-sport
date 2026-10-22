import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { SEO } from '@/components/SEO';
import { GlobalMatchdayCommandRibbon } from '@/components/GlobalMatchdayCommandRibbon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const SEOAuthorityHub = lazyWithRetry(() =>
  import('@/components/SEOAuthorityHub').then((m) => ({ default: m.SEOAuthorityHub }))
);
const Footer = lazyWithRetry(() =>
  import('@/components/Footer').then((m) => ({ default: m.Footer }))
);

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://predictpro.guru/#website',
      name: 'PredictPro — Football Fixtures, Live Scores, Standings & Match Previews',
      alternateName: ['PredictPro', 'PredictPro.guru'],
      url: 'https://predictpro.guru',
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://predictpro.guru/screener?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SportsOrganization',
      '@id': 'https://predictpro.guru/#organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
      logo: {
        '@type': 'ImageObject',
        url: 'https://predictpro.guru/pwa-512x512.png',
        width: 512,
        height: 512,
      },
      sport: 'Association Football (Soccer)',
      description:
        'Football match previews, live scores, expected goals (xG) statistics, player ratings, and league standings across 40+ global competitions.',
    },
    {
      '@type': 'ItemList',
      '@id': 'https://predictpro.guru/#matchday-events',
      name: 'Featured Football Fixtures & Live Scores',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'SportsEvent',
            name: 'Arsenal vs Chelsea — Premier League',
            startDate: '2026-10-19T19:00:00Z',
            eventStatus: 'https://schema.org/EventScheduled',
            sport: 'Association Football',
            homeTeam: { '@type': 'SportsTeam', name: 'Arsenal' },
            awayTeam: { '@type': 'SportsTeam', name: 'Chelsea' },
            isAccessibleForFree: true,
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'SportsEvent',
            name: 'Real Madrid vs Barcelona — LaLiga',
            startDate: '2026-10-19T20:00:00Z',
            eventStatus: 'https://schema.org/EventScheduled',
            sport: 'Association Football',
            homeTeam: { '@type': 'SportsTeam', name: 'Real Madrid' },
            awayTeam: { '@type': 'SportsTeam', name: 'Barcelona' },
            isAccessibleForFree: true,
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'SportsEvent',
            name: 'Gor Mahia vs AFC Leopards — FKF Premier League',
            startDate: '2026-10-19T15:00:00Z',
            eventStatus: 'https://schema.org/EventScheduled',
            sport: 'Association Football',
            homeTeam: { '@type': 'SportsTeam', name: 'Gor Mahia' },
            awayTeam: { '@type': 'SportsTeam', name: 'AFC Leopards' },
            isAccessibleForFree: true,
          },
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://predictpro.guru/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How are PredictPro football match probabilities calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Match probabilities are calculated using Poisson goal distribution models, Expected Goals (xG) differentials, player ratings, and club ELO ratings across 40+ global leagues.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which football leagues and competitions are covered?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Coverage includes the English Premier League, UEFA Champions League, LaLiga, Serie A, Bundesliga, Ligue 1, FKF Premier League, MLS, and international tournaments.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I generate free SportyBet, Betika, SportPesa, and Bet9ja booking codes on PredictPro?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. PredictPro includes a 1-Click Booking Code Exporter and Smart Treble Builder that generates instant multi-bet codes for SportyBet, Betika, SportPesa, Bet9ja, Betway, and 1xBet, with direct WhatsApp and Telegram slip sharing.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do shared WhatsApp and Telegram bet slip links work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When you share a PredictPro slip on WhatsApp or Telegram, the link encodes all match selections and odds so friends who click the link automatically load the exact accumulator slip into their Bet Slip.',
          },
        },
      ],
    },
  ],
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="PredictPro — Football Fixtures, Live Scores, xG & Predictions"
        description="Daily football fixtures, live scores, expected goals (xG) statistics, instant SportyBet/Betika/Bet9ja booking codes, and match probabilities across 40+ global competitions."
        canonical="/"
        keywords="football predictions today, sure wins today, sportybet booking codes today, betika jackpot predictions, live football scores, premier league fixtures, champions league previews, both teams to score tips, over 2.5 goals, expected goals xG statistics"
        jsonLd={HOME_JSON_LD}
      />
      <Navbar />

      <ErrorBoundary compact>
        <GlobalMatchdayCommandRibbon />
      </ErrorBoundary>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none py-5">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
          <h1 className="sr-only">
            Football Fixtures, Live Scores, Standings &amp; Match Previews
          </h1>
          <PredictionsDashboard />
        </div>
      </main>

      <Suspense fallback={null}>
        <SEOAuthorityHub />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
