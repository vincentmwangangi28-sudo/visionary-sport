import { Crown, Check, Zap, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MpesaPaymentDialog } from './MpesaPaymentDialog';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Zap, text: 'High-confidence predictions (85%+)' },
  { icon: TrendingUp, text: 'Advanced AI analysis & reasoning' },
  { icon: Shield, text: 'Priority access to daily picks' },
  { icon: Crown, text: 'Exclusive premium contests' },
];

export const PremiumUpgradeCard = () => {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            Most Popular
          </Badge>
          <Crown className="h-8 w-8 text-secondary" />
        </div>
        <CardTitle className="text-2xl">Premium Predictions</CardTitle>
        <CardDescription>
          Unlock the full power of AI-driven sports predictions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">KES 500</span>
          <span className="text-muted-foreground">/month</span>
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>

        <MpesaPaymentDialog
          purpose="premium_subscription"
          amount={500}
          title="Upgrade to Premium"
          buttonText="Upgrade Now - KES 500/mo"
        />

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime • Instant activation
        </p>
      </CardContent>
    </Card>
  );
};
