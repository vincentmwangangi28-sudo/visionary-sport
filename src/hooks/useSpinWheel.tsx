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
    if (!user) { setCanSpin(false); setLoading(false); return; }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('spin_wheel_entries').select('id')
      .eq('user_id', user.id).gte('spun_at', `${today}T00:00:00`).limit(1);
    setCanSpin(!data || data.length === 0);
    setLoading(false);
  };

  // Returns the server-determined prize index for animation sync
  const spin = async (): Promise<{ prize: SpinPrize; prizeIndex: number } | null> => {
    if (!user || !canSpin || spinning) return null;
    setSpinning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('spin-wheel', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || !data?.success) throw new Error(data?.error || 'Spin failed');
      setCanSpin(false);
      return { prize: data.prize as SpinPrize, prizeIndex: data.prizeIndex as number };
    } catch (err) {
      console.error('Spin error:', err);
      return null;
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => { checkCanSpin(); }, [user]);
  return { canSpin, loading, spinning, spin, checkCanSpin };
};
