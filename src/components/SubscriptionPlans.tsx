import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SubscriptionPlans = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          100% Free Open-Access Analytics
        </h2>
        <p className="text-muted-foreground mt-2">
          All quantitative tiers and analytical engines are unlocked at zero cost
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge className="bg-emerald-600 text-white text-[10px]">Unlocked</Badge>
              </div>
              <CardDescription>Unlimited daily match forecasts</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-5">
              <div>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                <span className="text-xs text-muted-foreground ml-1.5">forever</span>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full gap-1.5" variant="outline">
                <Link to="/today-predictions">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Active — View Forecasts
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
