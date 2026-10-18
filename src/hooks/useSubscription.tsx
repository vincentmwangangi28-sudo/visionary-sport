import { useState } from 'react';

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  expires_at: string;
  expiresAt?: string;
  price_kes: number;
}

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Community Access',
    price: 0,
    predictionsPerDay: -1,
    color: '#3b82f6',
    features: ['Unlimited daily AI forecasts', 'Full Expected Goals (xG) stats', '40+ global leagues', '100% Free Forever'],
  },
  {
    id: 'pro',
    name: 'Quantitative Pro (Free)',
    price: 0,
    predictionsPerDay: -1,
    color: '#10b981',
    features: ['Unlimited match predictions', '40+ leagues worldwide', '+EV Value Screener & CLV', 'Live In-Play xG Momentum'],
  },
  {
    id: 'vip',
    name: 'Full Open Access',
    price: 0,
    predictionsPerDay: -1,
    color: '#f59e0b',
    features: ['All Quantitative Models Included', 'Correct Score Poisson Matrices', 'Club xG & FDR Intelligence Hub', 'Zero Paywalls or Subscriptions'],
  },
];

const FREE_FOREVER_SUBSCRIPTION: Subscription = {
  id: 'free-open-access',
  plan: 'vip',
  status: 'active',
  expires_at: '2099-12-31T23:59:59.000Z',
  expiresAt: '2099-12-31T23:59:59.000Z',
  price_kes: 0,
};

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(FREE_FOREVER_SUBSCRIPTION);
  const [loading] = useState(false);

  // Entire platform is 100% free — all users have full unrestricted access
  const isPremium = () => true;

  const activateSubscription = async (planOrId: string | { id: string }) => {
    const planId = typeof planOrId === 'string' ? planOrId : planOrId.id;
    const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[2];
    const newSub: Subscription = {
      id: 'free-open-access',
      plan: selectedPlan.id,
      status: 'active',
      expires_at: '2099-12-31T23:59:59.000Z',
      expiresAt: '2099-12-31T23:59:59.000Z',
      price_kes: 0,
    };
    setSubscription(newSub);
    return { ...newSub, success: true, message: 'All features are 100% free and active on your account!' };
  };

  return {
    subscription,
    plan: 'vip' as const,
    isPremium,
    loading,
    activateSubscription,
    subscribe: activateSubscription,
  };
};
