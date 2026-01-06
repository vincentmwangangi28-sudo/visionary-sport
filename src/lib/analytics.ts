// GA4 Analytics utility functions for PredictPro

declare function gtag(...args: any[]): void;

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

// Track subscription start
export const trackSubscriptionStart = (plan: string, price: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'subscription_start', {
    event_category: 'Monetization',
    event_label: plan,
    value: price,
    currency: 'KES',
  });
};

// Track social shares
export const trackSocialShare = (platform: string, contentType: string) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'share', {
    method: platform,
    content_type: contentType,
    event_category: 'Social',
  });
};

// Track leaderboard entry
export const trackLeaderboardEntry = (position: number) => {
  if (!isGtagAvailable()) return;
  
  gtag('event', 'leaderboard_entry', {
    event_category: 'Engagement',
    event_label: `Position ${position}`,
    position: position,
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
