import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FREE_BUNDLES = [
  { id: 'daily', name: 'Today Match Digest', count: 'All Daily Fixtures', link: '/today-predictions' },
  { id: 'consensus', name: '80%+ High Consensus', count: 'Top Statistical Picks', link: '/best-bets' },
  { id: 'scores', name: 'Correct Score Matrices', count: '6×6 Poisson Heatmaps', link: '/correct-score' },
  { id: 'clubs', name: 'Club xG & FDR Hub', count: 'Rolling xG & Schedules', link: '/teams' },
];

export const PredictionBundles = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Open-Access Forecast Bundles
        </h2>
        <p className="text-muted-foreground mt-2">
          Every match bundle is 100% free and unlocked with zero limits
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FREE_BUNDLES.map((bundle) => (
          <Card key={bundle.id} className="border-border/70 hover:border-primary/40 transition-all">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit text-[10px] text-emerald-600 border-emerald-500/30 mb-1">
                <Sparkles className="h-3 w-3 mr-1" />
                100% Free
              </Badge>
              <CardTitle className="text-base">{bundle.name}</CardTitle>
              <CardDescription>{bundle.count}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">FREE</div>
              <Button asChild variant="outline" size="sm" className="w-full justify-between">
                <Link to={bundle.link}>
                  <span>Open Bundle</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
