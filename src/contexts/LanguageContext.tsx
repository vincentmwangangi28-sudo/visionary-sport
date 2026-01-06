import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface Translations {
  [key: string]: {
    en: string;
    sw: string;
  };
}

// Core translations - expandable
const translations: Translations = {
  // Navigation
  'nav.predictions': { en: 'Predictions', sw: 'Utabiri' },
  'nav.performance': { en: 'Performance', sw: 'Utendaji' },
  'nav.leaderboard': { en: 'Leaderboard', sw: 'Jedwali la Viongozi' },
  'nav.shop': { en: 'Shop', sw: 'Duka' },
  'nav.rewards': { en: 'Rewards', sw: 'Zawadi' },
  'nav.insights': { en: 'Insights', sw: 'Maarifa' },
  'nav.news': { en: 'News', sw: 'Habari' },
  'nav.about': { en: 'About', sw: 'Kuhusu' },
  'nav.signIn': { en: 'Sign In', sw: 'Ingia' },
  'nav.signOut': { en: 'Sign Out', sw: 'Toka' },
  
  // Hero Section
  'hero.title': { en: 'AI-Powered Sports Predictions', sw: 'Utabiri wa Michezo kwa AI' },
  'hero.subtitle': { en: 'Win smarter with confidence scores and expert reasoning', sw: 'Shinda kwa akili na alama za kujiamini' },
  'hero.cta': { en: 'Start Free Trial', sw: 'Anza Jaribio Bure' },
  'hero.viewPredictions': { en: "View Today's Predictions", sw: 'Tazama Utabiri wa Leo' },
  
  // Predictions
  'predictions.title': { en: 'Live AI Predictions', sw: 'Utabiri wa Moja kwa Moja' },
  'predictions.confidence': { en: 'Confidence', sw: 'Kujiamini' },
  'predictions.high': { en: 'High', sw: 'Juu' },
  'predictions.medium': { en: 'Medium', sw: 'Wastani' },
  'predictions.low': { en: 'Low', sw: 'Chini' },
  
  // Common
  'common.loading': { en: 'Loading...', sw: 'Inapakia...' },
  'common.error': { en: 'An error occurred', sw: 'Kosa limetokea' },
  'common.vs': { en: 'vs', sw: 'dhidi ya' },
  'common.share': { en: 'Share', sw: 'Shiriki' },
  
  // Matches
  'matches.live': { en: 'Live Matches', sw: 'Mechi za Moja kwa Moja' },
  'matches.upcoming': { en: 'Upcoming Matches', sw: 'Mechi Zijazo' },
  'matches.kickoff': { en: 'Kick-off', sw: 'Kuanza' },
  
  // Performance
  'performance.title': { en: 'Performance Dashboard', sw: 'Dashibodi ya Utendaji' },
  'performance.accuracy': { en: 'Accuracy', sw: 'Usahihi' },
  'performance.streak': { en: 'Winning Streak', sw: 'Mfululizo wa Ushindi' },
  'performance.total': { en: 'Total Predictions', sw: 'Jumla ya Utabiri' },
  
  // Leaderboard
  'leaderboard.title': { en: 'Top Predictors', sw: 'Watabiri Bora' },
  'leaderboard.rank': { en: 'Rank', sw: 'Nafasi' },
  'leaderboard.score': { en: 'Score', sw: 'Alama' },
  
  // Notifications
  'notifications.enable': { en: 'Enable Notifications', sw: 'Washa Arifa' },
  'notifications.enabled': { en: 'Notifications Enabled', sw: 'Arifa Zimewashwa' },
  
  // Shop
  'shop.coins': { en: 'Coins', sw: 'Sarafu' },
  'shop.buy': { en: 'Buy', sw: 'Nunua' },
  'shop.balance': { en: 'Your Balance', sw: 'Salio Lako' },
  
  // Footer
  'footer.disclaimer': { en: '18+ | Gamble Responsibly', sw: '18+ | Kamari kwa Uwajibikaji' },
  'footer.privacy': { en: 'Privacy Policy', sw: 'Sera ya Faragha' },
  'footer.terms': { en: 'Terms of Service', sw: 'Masharti ya Huduma' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('predictpro-language') as Language;
      return saved || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('predictpro-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
