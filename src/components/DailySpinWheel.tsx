import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSpinWheel, SPIN_PRIZES, SpinPrize } from '@/hooks/useSpinWheel';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const DailySpinWheel = () => {
  const { user } = useAuth();
  const { canSpin, loading, spinning, spin } = useSpinWheel();
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<SpinPrize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [animating, setAnimating] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (!canSpin || spinning || animating) return;
    setShowResult(false);
    setPrize(null);
    setAnimating(true);

    // Call server first — server decides the prize
    const result = await spin();
    if (!result) { setAnimating(false); return; }

    // Animate wheel to land exactly on the server-chosen prize
    const segmentAngle = 360 / SPIN_PRIZES.length;
    const targetAngle = 360 - (result.prizeIndex * segmentAngle + segmentAngle / 2);
    const spins = 4 + Math.floor(Math.random() * 2);
    const newRotation = rotation + spins * 360 + targetAngle - (rotation % 360);
    setRotation(newRotation);

    setTimeout(() => {
      setPrize(result.prize);
      setShowResult(true);
      setAnimating(false);
      if (result.prize.type !== 'nothing') toast.success(`You won: ${result.prize.label}!`);
      else toast.info('Better luck tomorrow!');
    }, 4200);
  };

  if (loading) return (
    <Card className="border-primary/20">
      <CardContent className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <CardTitle>Daily Spin Wheel</CardTitle>
        </div>
        <CardDescription>Spin once daily to win free coins!</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            </div>
            <div ref={wheelRef}
              className="relative w-64 h-64 rounded-full border-4 border-primary shadow-xl transition-transform duration-[4000ms] ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${SPIN_PRIZES.map((p, i) => `${p.color} ${(i * 100) / SPIN_PRIZES.length}% ${((i + 1) * 100) / SPIN_PRIZES.length}%`).join(', ')})`,
              }}>
              {SPIN_PRIZES.map((p, index) => {
                const angle = (index * 360) / SPIN_PRIZES.length + 360 / SPIN_PRIZES.length / 2;
                return (
                  <div key={index} className="absolute w-full h-full" style={{ transform: `rotate(${angle}deg)` }}>
                    <span className="absolute left-1/2 top-4 -translate-x-1/2 text-[10px] font-bold text-white drop-shadow-md whitespace-nowrap">{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {showResult && prize && (
            <div className={`text-center p-4 rounded-lg w-full ${prize.type === 'nothing' ? 'bg-muted' : 'bg-primary/10 border border-primary/20'}`}>
              <p className="text-lg font-bold">{prize.type === 'nothing' ? '😅 ' : '🎉 '}{prize.label}</p>
              {prize.type !== 'nothing' && <p className="text-sm text-muted-foreground">Added to your account!</p>}
            </div>
          )}

          {!user ? (
            <Button asChild className="w-full"><Link to="/auth"><Lock className="mr-2 h-4 w-4" />Login to Spin</Link></Button>
          ) : (
            <Button onClick={handleSpin} disabled={!canSpin || spinning || animating}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
              {animating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Spinning...</> :
                canSpin ? <><Gift className="mr-2 h-4 w-4" />Spin Now!</> : 'Come back tomorrow!'}
            </Button>
          )}
          {user && !canSpin && !animating && (
            <p className="text-sm text-muted-foreground text-center">You've already spun today. Come back tomorrow!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
