import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SpinPrize {
  type: 'coins' | 'prediction' | 'nothing' | 'bonus';
  amount: number;
  label: string;
  color: string;
}

export const SPIN_PRIZES: SpinPrize[] = [
  { type: 'coins', amount: 10, label: '10 Coins', color: '#FFD700' },
  { type: 'coins', amount: 25, label: '25 Coins', color: '#FFA500' },
  { type: 'coins', amount: 50, label: '50 Coins', color: '#FF6347' },
  { type: 'prediction', amount: 1, label: 'Free Prediction', color: '#9B59B6' },
  { type: 'nothing', amount: 0, label: 'Try Again', color: '#95A5A6' },
  { type: 'bonus', amount: 100, label: '100 Coins!', color: '#E74C3C' },
  { type: 'coins', amount: 15, label: '15 Coins', color: '#3498DB' },
  { type: 'nothing', amount: 0, label: 'Better Luck', color: '#7F8C8D' },
];

export const useSpinWheel = () => {
  const { user } = useAuth();
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const checkCanSpin = async () => {
    if (!user) {
      setCanSpin(false);
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('spin_wheel_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('spun_at', `${today}T00:00:00`)
        .lte('spun_at', `${today}T23:59:59`);

      if (error) throw error;
      setCanSpin(!data || data.length === 0);
    } catch (error) {
      console.error('Error checking spin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const spin = async (): Promise<SpinPrize | null> => {
    if (!user || !canSpin || spinning) return null;

    setSpinning(true);
    
    // Random prize selection with weighted probability
    const weights = [20, 15, 10, 5, 25, 2, 18, 5]; // Probability weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let prizeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        prizeIndex = i;
        break;
      }
    }

    const prize = SPIN_PRIZES[prizeIndex];

    try {
      // Record the spin
      const { error: spinError } = await supabase
        .from('spin_wheel_entries')
        .insert({
          user_id: user.id,
          prize_type: prize.type,
          prize_amount: prize.amount,
        });

      if (spinError) throw spinError;

      // Award coins if applicable
      if (prize.type === 'coins' || prize.type === 'bonus') {
        // Get current coins and update
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ coins: profile.coins + prize.amount })
            .eq('id', user.id);
        }
      }

      setCanSpin(false);
      return prize;
    } catch (error) {
      console.error('Error spinning wheel:', error);
      return null;
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    checkCanSpin();
  }, [user]);

  return { canSpin, loading, spinning, spin, checkCanSpin };
};
