import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Zap, Star, Trophy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const SEGMENTS = [
  { label: '10 Coins',   color: '#FFD700', emoji: '🪙', type: 'coins',   amount: 10  },
  { label: 'Try Again',  color: '#6b7280', emoji: '😔', type: 'nothing', amount: 0   },
  { label: '25 Coins',   color: '#f59e0b', emoji: '💰', type: 'coins',   amount: 25  },
  { label: 'Free Tip',   color: '#8b5cf6', emoji: '🔮', type: 'prediction', amount: 1 },
  { label: '15 Coins',   color: '#3b82f6', emoji: '🪙', type: 'coins',   amount: 15  },
  { label: 'Try Again',  color: '#6b7280', emoji: '😔', type: 'nothing', amount: 0   },
  { label: '100 Coins!', color: '#ef4444', emoji: '🎉', type: 'bonus',   amount: 100 },
  { label: '50 Coins',   color: '#10b981', emoji: '💎', type: 'coins',   amount: 50  },
];

export default function Rewards() {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [coins, setCoins] = useState(0);
  const [lastPrize, setLastPrize] = useState<{ label: string; type: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('coins').eq('id', user.id).single()
      .then(({ data }) => { if (data) setCoins(data.coins ?? 0); });
  }, [user]);

  const spin = async () => {
    if (!user || spinning || !canSpin) return;
    setSpinning(true);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = spins * 360 + Math.floor(Math.random() * 360);
    setRotation(r => r + finalAngle);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data } = await supabase.functions.invoke('spin-wheel', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setTimeout(() => {
        setSpinning(false);
        if (data?.success) {
          setLastPrize(data.prize);
          setCanSpin(false);
          if (data.prize?.type !== 'nothing') {
            toast.success(`🎉 You won: ${data.prize.label}!`);
            if (data.prize.amount > 0) setCoins(c => c + data.prize.amount);
          } else toast.info('Better luck tomorrow!');
        } else if (data?.canSpin === false) {
          setCanSpin(false);
          toast.error('Already spun today. Come back tomorrow!');
        }
      }, 3500);
    } catch { setSpinning(false); toast.error('Spin failed. Try again.'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Daily Rewards & Spin Wheel | PredictPro" description="Spin the wheel daily to earn coins. Redeem for premium AI football predictions on PredictPro." canonical="/rewards" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary" />Daily Rewards
          </h1>
          <p className="text-muted-foreground">Spin daily, earn coins, unlock premium predictions.</p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-3 bg-primary/10 rounded-full px-4 py-1.5">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-primary">{coins.toLocaleString()} coins</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Spin Wheel */}
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-primary" />Spin the Wheel
            </CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
              {/* Wheel */}
              <div className="relative w-52 h-52">
                <div
                  ref={wheelRef}
                  className="w-full h-full rounded-full border-4 border-primary/40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden"
                  style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
                  {SEGMENTS.map((s, i) => (
                    <div key={i} className="absolute text-xl font-bold"
                      style={{ transform: `rotate(${i*(360/SEGMENTS.length)}deg) translateY(-68px)` }}>
                      {s.emoji}
                    </div>
                  ))}
                  <div className="absolute inset-6 rounded-full bg-background/90 flex items-center justify-center z-10">
                    <span className="font-black text-primary text-xl">PP</span>
                  </div>
                </div>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary" />
                </div>
              </div>

              {/* Prize result */}
              {lastPrize && lastPrize.type !== 'nothing' && (
                <div className="w-full text-center bg-primary/10 border border-primary/20 rounded-xl p-3">
                  <p className="text-xl font-black text-primary">🎉 {lastPrize.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">Added to your balance!</p>
                </div>
              )}

              {!user ? (
                <Link to="/auth" className="w-full">
                  <Button className="w-full gap-2"><Gift className="h-4 w-4" />Sign in to Spin</Button>
                </Link>
              ) : (
                <Button onClick={spin} disabled={spinning || !canSpin} size="lg" className="w-full gap-2">
                  {spinning ? <><RefreshCw className="h-4 w-4 animate-spin" />Spinning...</>
                  : canSpin ? <><Zap className="h-4 w-4" />Spin Now!</>
                  : '✅ Spun Today — Come Back Tomorrow'}
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">One free spin per day · Resets midnight EAT</p>
            </CardContent>
          </Card>

          {/* Ways to earn + redeem */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ways to Earn</h3>
            {[
              { icon: Star,   label: 'Daily Spin',        desc: 'One free spin every 24hrs',         reward: '10–100 coins' },
              { icon: Zap,    label: 'Share a Tip',        desc: 'Post a prediction on Tipsters',     reward: '10 coins',    link: '/tipsters' },
              { icon: Trophy, label: 'Tip Wins',           desc: 'Your community tip is correct',     reward: '25 coins',    link: '/tipsters' },
              { icon: Gift,   label: 'Refer a Friend',     desc: 'Use your referral code',            reward: '50 coins each' },
            ].map(({ icon: Icon, label, desc, reward, link }) => (
              <Card key={label} className="hover:border-primary/20 transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <Badge className="mt-1 bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">+{reward}</Badge>
                  </div>
                  {link && <Link to={link}><Button variant="outline" size="sm">Go</Button></Link>}
                </CardContent>
              </Card>
            ))}

            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" />Redeem Coins</h4>
                <div className="space-y-1.5 text-sm">
                  {[['Premium Prediction', '100'], ['Correct Score Unlock', '200'], ['Basic Plan (1 day)', '500'], ['Pro Plan (1 month)', '5,000']].map(([item, cost]) => (
                    <div key={item} className="flex justify-between">
                      <span className="text-muted-foreground">{item}</span>
                      <span className="font-bold">🪙 {cost}</span>
                    </div>
                  ))}
                </div>
                <Link to="/shop">
                  <Button size="sm" className="w-full mt-3 gap-2"><Trophy className="h-4 w-4" />Go to Shop</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
