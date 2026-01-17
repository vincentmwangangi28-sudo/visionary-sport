// GA4 Analytics utility functions for PredictPro

declare function gtag(...args: unknown[]): void;

// Check if gtag is available
const isGtagAvailable = () => typeof gtag !== 'undefined';

// Track page views
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
};

// Track prediction views
export const trackPredictionView = (prediction: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  confidence: number;
  league: string;
}) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'prediction_view', {
    event_category: 'Predictions',
    event_label: `${prediction.homeTeam} vs ${prediction.awayTeam}`,
    match_id: prediction.matchId,
    confidence_score: prediction.confidence,
    league: prediction.league,
  });
};

// Track organic entry (for SEO tracking)
export const trackOrganicEntry = () => {
  if (!isGtagAvailable()) return;
  
  const referrer = document.referrer;
  const isOrganic = referrer.includes('google.') || 
                    referrer.includes('bing.') || 
                    referrer.includes('yahoo.') ||
                    referrer.includes('duckduckgo.');
  
  if (isOrganic) {
    gtag('event', 'organic_entry', {
      event_category: 'Traffic',
      event_label: 'Google Search',
      referrer: referrer,
    });
  }
};

// Track leaderboard interactions
export const trackLeaderboardClick = (position: number, userName?: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'leaderboard_click', {
    event_category: 'Engagement',
    event_label: `Position ${position}`,
    user_position: position,
    user_name: userName || 'Anonymous',
  });
};

// Track leaderboard entry (viewing)
export const trackLeaderboardEntry = (timeframe: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'leaderboard_entry', {
    event_category: 'Engagement',
    event_label: timeframe,
  });
};

// Track trial/signup events
export const trackTrialStart = (source: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'trial_start', {
    event_category: 'Onboarding',
    event_label: source,
    conversion: true,
  });
};

export const trackSignupStart = (method: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'signup_start', {
    event_category: 'Onboarding',
    event_label: method,
    signup_method: method,
  });
};

export const trackSignupComplete = (method: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'sign_up', {
    method: method,
    conversion: true,
  });
};

// Track payment events
export const trackPaymentInitiated = (
  purpose: string,
  amount: number,
  method: string
) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'begin_checkout', {
    currency: 'KES',
    value: amount,
    items: [{
      item_name: purpose,
      price: amount,
      quantity: 1,
    }],
  });
};

export const trackPaymentComplete = (
  purpose: string,
  amount: number,
  transactionId: string
) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'KES',
    value: amount,
    items: [{
      item_name: purpose,
      price: amount,
      quantity: 1,
    }],
  });
};

// Track contest entries
export const trackContestEntry = (contestId: string, entryFee: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'contest_entry', {
    event_category: 'Contests',
    event_label: contestId,
    entry_fee: entryFee,
  });
};

// Track feature engagement
export const trackFeatureEngagement = (featureName: string, action: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'feature_engagement', {
    event_category: 'Engagement',
    event_label: featureName,
    action: action,
  });
};

// ============== NEW COMPREHENSIVE GA4 EVENTS ==============

// Track subscription start
export const trackSubscriptionStart = (plan: string, price: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'subscription_start', {
    event_category: 'Monetization',
    event_label: plan,
    plan_name: plan,
    plan_price: price,
    currency: 'KES',
    conversion: true,
  });
};

// Track subscription renewal
export const trackSubscriptionRenew = (plan: string, price: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'subscription_renew', {
    event_category: 'Monetization',
    event_label: plan,
    plan_name: plan,
    plan_price: price,
    currency: 'KES',
  });
};

// Track referral signup
export const trackReferralSignup = (referralCode: string, source: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'referral_signup', {
    event_category: 'Referral',
    event_label: referralCode,
    referral_code: referralCode,
    referral_source: source,
    conversion: true,
  });
};

// Track referral share
export const trackReferralShare = (platform: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'referral_share', {
    event_category: 'Referral',
    event_label: platform,
    share_platform: platform,
  });
};

// Track share prediction
export const trackSharePrediction = (platform: string, matchId: string, confidence: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'share_prediction', {
    event_category: 'Social',
    event_label: platform,
    share_platform: platform,
    match_id: matchId,
    confidence_score: confidence,
  });
};

// Track news article view
export const trackNewsArticleView = (articleId: string, category: string, title: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'news_article_view', {
    event_category: 'Content',
    event_label: title,
    article_id: articleId,
    article_category: category,
  });
};

// Track poll vote
export const trackPollVote = (pollId: string, question: string, selectedOption: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'poll_vote', {
    event_category: 'Engagement',
    event_label: question.substring(0, 50),
    poll_id: pollId,
    selected_option: selectedOption,
  });
};

// Track upset alert view
export const trackUpsetAlertView = (matchId: string, teams: string, confidence: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'upset_alert_view', {
    event_category: 'Predictions',
    event_label: teams,
    match_id: matchId,
    confidence_score: confidence,
  });
};

// Track smart slip creation
export const trackSmartSlipCreate = (slipId: string, predictionCount: number, totalOdds: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'smart_slip_create', {
    event_category: 'Smart Slip',
    event_label: `${predictionCount} selections`,
    slip_id: slipId,
    prediction_count: predictionCount,
    total_odds: totalOdds,
  });
};

// Track badge earned
export const trackBadgeEarned = (badgeName: string, badgeType: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'badge_earned', {
    event_category: 'Gamification',
    event_label: badgeName,
    badge_name: badgeName,
    badge_type: badgeType,
  });
};

// Track spin wheel
export const trackSpinWheel = (prizeType: string, prizeAmount: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'spin_wheel', {
    event_category: 'Gamification',
    event_label: prizeType,
    prize_type: prizeType,
    prize_amount: prizeAmount,
  });
};

// Track transfer rumor view
export const trackTransferRumorView = (playerName: string, targetClub: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'transfer_rumor_view', {
    event_category: 'Content',
    event_label: `${playerName} to ${targetClub}`,
    player_name: playerName,
    target_club: targetClub,
  });
};

// Track coin purchase
export const trackCoinPurchase = (packageName: string, coins: number, price: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'coin_purchase', {
    event_category: 'Monetization',
    event_label: packageName,
    package_name: packageName,
    coin_amount: coins,
    price_kes: price,
    currency: 'KES',
    conversion: true,
  });
};

// Track push notification subscribe
export const trackPushSubscribe = () => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'push_subscribe', {
    event_category: 'Notifications',
    event_label: 'Push Enabled',
    conversion: true,
  });
};

// Track live match interaction
export const trackLiveMatchInteraction = (matchId: string, action: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'live_match_interaction', {
    event_category: 'Live',
    event_label: action,
    match_id: matchId,
    action_type: action,
  });
};

// Track search usage
export const trackSearch = (query: string, resultsCount: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'search', {
    event_category: 'Navigation',
    search_term: query,
    results_count: resultsCount,
  });
};

// Track scroll depth
export const trackScrollDepth = (percentage: number, pagePath: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'scroll_depth', {
    event_category: 'Engagement',
    event_label: `${percentage}%`,
    scroll_percentage: percentage,
    page_path: pagePath,
  });
};

// Generic track event for custom events
export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', eventName, {
    event_category: 'Custom',
    ...params,
  });
};

// Initialize tracking on page load
export const initAnalytics = () => {
  if (!isGtagAvailable()) return;
  
  // Track organic entry
  trackOrganicEntry();
  
  // Track page view
  trackPageView(window.location.pathname, document.title);
};
