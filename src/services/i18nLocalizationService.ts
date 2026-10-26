import { useState, useEffect } from 'react';

export type SupportedLocale = 'en' | 'sw' | 'fr' | 'pt' | 'ar';

export interface LocaleMeta {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
  regionLabel: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  {
    code: 'en',
    label: 'EN',
    nativeLabel: 'English',
    regionLabel: 'Global / UK / East & West Africa',
    dir: 'ltr',
  },
  {
    code: 'sw',
    label: 'SW',
    nativeLabel: 'Kiswahili',
    regionLabel: 'Kenya / Tanzania / Uganda / DRC',
    dir: 'ltr',
  },
  {
    code: 'fr',
    label: 'FR',
    nativeLabel: 'Français',
    regionLabel: 'Sénégal / Côte d’Ivoire / Cameroun / Maroc / France',
    dir: 'ltr',
  },
  {
    code: 'pt',
    label: 'PT',
    nativeLabel: 'Português',
    regionLabel: 'Angola / Moçambique / Brasil / Portugal',
    dir: 'ltr',
  },
  {
    code: 'ar',
    label: 'AR',
    nativeLabel: 'العربية',
    regionLabel: 'Egypt / Morocco / Tunisia / MENA',
    dir: 'rtl',
  },
];

const LOCALE_STORAGE_KEY = 'predictpro_active_locale_v1';
export const LOCALE_CHANGE_EVENT = 'predictpro-locale-change';

const UI_DICTIONARY: Record<
  SupportedLocale,
  {
    navMatches: string;
    navLiveScores: string;
    navMultiView: string;
    navSlipConverter: string;
    navStandings: string;
    navScreener: string;
    navAccaBuilder: string;
    navMore: string;
    slipButton: string;
    joinFree: string;
    signIn: string;
    marketHomeWin: string;
    marketDraw: string;
    marketAwayWin: string;
    marketOver25: string;
    marketBttsYes: string;
    marketDoubleChance: string;
    clvScannerTitle: string;
    sgpBuilderTitle: string;
  }
> = {
  en: {
    navMatches: 'Matches',
    navLiveScores: 'Live Scores',
    navMultiView: 'Multi-View TV',
    navSlipConverter: 'Slip & Code Converter',
    navStandings: 'Standings',
    navScreener: 'Stats Screener',
    navAccaBuilder: 'Acca Builder',
    navMore: 'More',
    slipButton: 'Slip',
    joinFree: 'Join Free',
    signIn: 'Sign In',
    marketHomeWin: 'Home Win (1)',
    marketDraw: 'Draw (X)',
    marketAwayWin: 'Away Win (2)',
    marketOver25: 'Over 2.5 Goals',
    marketBttsYes: 'Both Teams to Score (BTTS)',
    marketDoubleChance: 'Double Chance (1X / X2)',
    clvScannerTitle: 'Closing Line Value (CLV) & Sharp Steam Scanner',
    sgpBuilderTitle: 'Correlated Same-Game Parlay (SGP) Copula Builder',
  },
  sw: {
    navMatches: 'Mechi',
    navLiveScores: 'Matokeo Mubashara',
    navMultiView: 'TV ya Mechi 4',
    navSlipConverter: 'Kodi za Kubeti',
    navStandings: 'Msimamo',
    navScreener: 'Takwimu xG',
    navAccaBuilder: 'Mkeka Mseto',
    navMore: 'Zaidi',
    slipButton: 'Mkeka',
    joinFree: 'Jiunge Bure',
    signIn: 'Ingia',
    marketHomeWin: 'Ushindi wa Nyumbani (1)',
    marketDraw: 'Sare (X)',
    marketAwayWin: 'Ushindi wa Ugenini (2)',
    marketOver25: 'Zaidi ya Magoli 2.5 (Over 2.5)',
    marketBttsYes: 'Timu Zote Kufungana (GG / BTTS)',
    marketDoubleChance: 'Nafasi Mbili (1X / X2)',
    clvScannerTitle: 'Kipima Thamani ya Odds (CLV) & Mkeka wa Kitaalamu',
    sgpBuilderTitle: 'Mjenzi wa Mkeka wa Mechi Moja (SGP Copula)',
  },
  fr: {
    navMatches: 'Matchs',
    navLiveScores: 'Scores en Direct',
    navMultiView: 'Multi-Écran TV',
    navSlipConverter: 'Codes Coupons',
    navStandings: 'Classements',
    navScreener: 'Filtre Stats xG',
    navAccaBuilder: 'Combiné Pro',
    navMore: 'Plus',
    slipButton: 'Coupon',
    joinFree: 'Accès Gratuit',
    signIn: 'Connexion',
    marketHomeWin: 'Victoire Domicile (1)',
    marketDraw: 'Match Nul (X)',
    marketAwayWin: 'Victoire Extérieur (2)',
    marketOver25: 'Plus de 2,5 Buts',
    marketBttsYes: 'Les Deux Équipes Marquent (BTTS)',
    marketDoubleChance: 'Chance Double (1X / X2)',
    clvScannerTitle: 'Scanner CLV (Closing Line Value) & Mouvements Sharp',
    sgpBuilderTitle: 'Constructeur SGP Corrélé (Modèle Copule Gaussienne)',
  },
  pt: {
    navMatches: 'Jogos',
    navLiveScores: 'Ao Vivo',
    navMultiView: 'Multi-Tela TV',
    navSlipConverter: 'Conversor de Códigos',
    navStandings: 'Classificação',
    navScreener: 'Filtro xG',
    navAccaBuilder: 'Múltipla Pro',
    navMore: 'Mais',
    slipButton: 'Boletim',
    joinFree: 'Entrar Grátis',
    signIn: 'Entrar',
    marketHomeWin: 'Vitória Casa (1)',
    marketDraw: 'Empate (X)',
    marketAwayWin: 'Vitória Fora (2)',
    marketOver25: 'Mais de 2.5 Gols',
    marketBttsYes: 'Ambas Marcam (BTTS — Sim)',
    marketDoubleChance: 'Dupla Hipótese (1X / X2)',
    clvScannerTitle: 'Scanner de Valor de Fecho (CLV) & Fluxo Sharp',
    sgpBuilderTitle: 'Construtor de Múltipla Mesmo Jogo (SGP Copula)',
  },
  ar: {
    navMatches: 'المباريات',
    navLiveScores: 'نتائج مباشرة',
    navMultiView: 'بث رباعي مباشر',
    navSlipConverter: 'محول أكواد الرهان',
    navStandings: 'الترتيب',
    navScreener: 'ماسح الإحصائيات',
    navAccaBuilder: 'صانع التراكمي',
    navMore: 'المزيد',
    slipButton: 'القسيمة',
    joinFree: 'انضم مجاناً',
    signIn: 'دخول',
    marketHomeWin: 'فوز المضيف (1)',
    marketDraw: 'تعادل (X)',
    marketAwayWin: 'فوز الضيف (2)',
    marketOver25: 'أكثر من 2.5 هدف',
    marketBttsYes: 'كلا الفريقين يسجلان (BTTS)',
    marketDoubleChance: 'فرصة مزدوجة (1X / X2)',
    clvScannerTitle: 'ماسح قيمة خط الإغلاق (CLV) وحركة السيولة الذكية',
    sgpBuilderTitle: 'صانع بارلاي المباراة الواحدة المترابط (SGP Copula)',
  },
};

export function getActiveLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
    if (saved && UI_DICTIONARY[saved]) return saved;
  } catch {
    // ignore
  }
  return 'en';
}

export function setActiveLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale } }));
  } catch {
    // ignore
  }
}

export function getLocaleStrings(locale: SupportedLocale = getActiveLocale()) {
  return UI_DICTIONARY[locale] || UI_DICTIONARY.en;
}

export function useAppLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => getActiveLocale());

  useEffect(() => {
    const handler = () => {
      setLocaleState(getActiveLocale());
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
  }, []);

  const changeLocale = (next: SupportedLocale) => {
    setActiveLocale(next);
    setLocaleState(next);
  };

  return {
    locale,
    changeLocale,
    t: getLocaleStrings(locale),
    meta: SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0],
    locales: SUPPORTED_LOCALES,
  };
}

export function generateMultilingualBroadcastText(
  locale: SupportedLocale,
  params: {
    dateLabel: string;
    sportyCode: string;
    sportyOdds: string;
    onexCode: string;
    onexOdds: string;
    bet9jaCode: string;
    bet9jaOdds: string;
    jackpotPool: string;
  }
): string {
  if (locale === 'sw') {
    return [
      `🔥 MKEKA WA KITAALAMU WA PREDICTPRO (${params.dateLabel})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚽ 1. Arsenal vs Chelsea — Zaidi ya Magoli 2.5 (Over 2.5) @ 1.72 (Uhakika: 86%)`,
      `⚽ 2. Real Madrid vs Barcelona — Timu Zote Kufungana (GG) @ 1.65 (Uhakika: 84%)`,
      `⚽ 3. Bayern Munich vs Dortmund — Ushindi wa Nyumbani & Over 1.5 @ 1.64 (Uhakika: 88%)`,
      `⚽ 4. Gor Mahia vs AFC Leopards — Gor Mahia Kushinda (1) @ 1.75 (Uhakika: 83%)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎟️ Kodi ya SportyBet: ${params.sportyCode} (${params.sportyOdds} Odds)`,
      `🎟️ Kodi ya 1xBet: ${params.onexCode} (${params.onexOdds} Odds)`,
      `🎟️ Kodi ya Bet9ja: ${params.bet9jaCode} (${params.bet9jaOdds} Odds)`,
      `🏆 17-Game Mega Jackpot (${params.jackpotPool}): Chaguzi 6 za Uhakika zimefungwa!`,
      `🌐 Uchambuzi Bure 100%: https://predictpro.guru/booking-code-converter`,
    ].join('\n');
  }

  if (locale === 'fr') {
    return [
      `🔥 PRONOSTICS QUANTITATIFS PREDICTPRO (${params.dateLabel})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚽ 1. Arsenal vs Chelsea — Plus de 2,5 Buts @ 1.72 (Modèle Poisson: 86%)`,
      `⚽ 2. Real Madrid vs Barcelone — Les Deux Équipes Marquent (BTTS) @ 1.65 (84%)`,
      `⚽ 3. Bayern Munich vs Dortmund — Victoire Bayern & +1,5 Buts @ 1.64 (88%)`,
      `⚽ 4. Al Ahly vs Mamelodi Sundowns — Chance Double 1X & +1,5 Buts @ 1.58 (85%)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎟️ Code 1xBet: ${params.onexCode} (Cote ${params.onexOdds})`,
      `🎟️ Code SportyBet: ${params.sportyCode} (Cote ${params.sportyOdds})`,
      `🏆 Mega Jackpot 17 Matchs (${params.jackpotPool}): 6 bases mathématiques verrouillées!`,
      `🌐 Accès 100% Gratuit: https://predictpro.guru/booking-code-converter`,
    ].join('\n');
  }

  if (locale === 'pt') {
    return [
      `🔥 PALPITES QUANTITATIVOS PREDICTPRO (${params.dateLabel})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚽ 1. Arsenal vs Chelsea — Mais de 2.5 Gols @ 1.72 (Probabilidade: 86%)`,
      `⚽ 2. Real Madrid vs Barcelona — Ambas Marcam (BTTS Sim) @ 1.65 (84%)`,
      `⚽ 3. Bayern Munique vs Dortmund — Casa Vence & +1.5 Gols @ 1.64 (88%)`,
      `⚽ 4. Sporting CP vs Braga — Vitória Casa (1) @ 1.68 (85%)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎟️ Código 1xBet: ${params.onexCode} (Odd ${params.onexOdds})`,
      `🎟️ Código SportyBet: ${params.sportyCode} (Odd ${params.sportyOdds})`,
      `🏆 Mega Jackpot 17 Jogos (${params.jackpotPool}): 6 banqueiros matemáticos!`,
      `🌐 100% Gratuito: https://predictpro.guru/booking-code-converter`,
    ].join('\n');
  }

  if (locale === 'ar') {
    return [
      `🔥 التوقعات الرقمية اليومية من PREDICTPRO (${params.dateLabel})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚽ 1. أرسنال ضد تشيلسي — أكثر من 2.5 هدف @ 1.72 (الاحتمال: 86%)`,
      `⚽ 2. ريال مدريد ضد برشلونة — كلا الفريقين يسجلان (BTTS) @ 1.65 (84%)`,
      `⚽ 3. بايرن ميونخ ضد دورتموند — فوز بايرن وأكثر من 1.5 هدف @ 1.64 (88%)`,
      `⚽ 4. الأهلي ضد ماميلودي صن داونز — فرصة مزدوجة 1X @ 1.55 (86%)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎟️ كود 1xBet: ${params.onexCode} (معامل ${params.onexOdds})`,
      `🎟️ كود SportyBet: ${params.sportyCode} (معامل ${params.sportyOdds})`,
      `🌐 مجاني 100% بالكامل: https://predictpro.guru/booking-code-converter`,
    ].join('\n');
  }

  return [
    `🔥 PREDICTPRO QUANTITATIVE DAILY CARD (${params.dateLabel})`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚽ 1. Arsenal vs Chelsea — Over 2.5 Match Goals @ 1.72 (Model: 86% | +11.4% CLV)`,
    `⚽ 2. Real Madrid vs Barcelona — BTTS Yes @ 1.65 (Model: 84% | +9.8% CLV)`,
    `⚽ 3. Bayern Munich vs Dortmund — Home Win & Over 1.5 @ 1.64 (Model: 88% | +12.1% CLV)`,
    `⚽ 4. Gor Mahia vs AFC Leopards — Home Win (1) @ 1.75 (Model: 83% | +9.5% CLV)`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🎟️ SportyBet Code: ${params.sportyCode} (${params.sportyOdds}x)`,
    `🎟️ 1xBet Code: ${params.onexCode} (${params.onexOdds}x)`,
    `🎟️ Bet9ja Code: ${params.bet9jaCode} (${params.bet9jaOdds}x)`,
    `🏆 17-Game Mega Jackpot (${params.jackpotPool}): 6 Locked Poisson Bankers!`,
    `🌐 100% Free Analytics Hub: https://predictpro.guru/closing-line-value`,
  ].join('\n');
}
