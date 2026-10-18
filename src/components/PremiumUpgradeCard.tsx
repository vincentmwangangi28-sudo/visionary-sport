import { Check, Zap, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const features = [
  { icon: Zap, text: 'High-consensus match forecasts (80%+)' },
  { icon: TrendingUp, text: 'Full Bivariate Poisson & xG reasoning' },
  { icon: ShieldCheck, text: 'Correct Score matrices & Referee xG' },
  { icon: Sparkles, text: 'Club xG & 5-Match FDR Intelligence Hub' },
];

export const PremiumUpgradeCard = () => {
  return (
    <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-primary/5">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-600 text-white">100% Free Forever</Badge>
          <ShieldCheck className="h-7 w-7 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl">Full Open-Access Analytics</CardTitle>
        <CardDescription>
          Every quantitative football model and match forecast is unlocked for free
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 relative">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">FREE</span>
          <span className="text-sm text-muted-foreground">· No subscription required</span>
        </div>

        <ul className="space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>

        <Link to="/today-predictions" className="block">
          <Button className="w-full font-bold gap-2">
            <Sparkles className="h-4 w-4" />
            Explore All Free Forecasts
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
