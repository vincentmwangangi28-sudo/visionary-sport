import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Check, Loader2, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { subscription, activateSubscription, loading, subscribe } = useSubscription();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    setSubscribing(planId);
    const result = await activateSubscription(plan);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setSubscribing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" />
          Premium Subscriptions
        </h2>
        <p className="text-muted-foreground mt-2">
          Choose a plan that fits your prediction needs
        </p>
      </div>

      {subscription && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    Active: {SUBSCRIPTION_PLANS.find((p) => p.id === subscription.plan)?.name} Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id;
          const isPopular = plan.id === 'pro';

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isPopular ? 'border-primary shadow-primary/20' : 'border-border'
              } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary">Most Popular</Badge>
                </div>
              )}

              <CardHeader className={`bg-gradient-to-r ${plan.color} text-white`}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-white/80">
                  {plan.predictionsPerDay === -1
                    ? 'Unlimited predictions'
                    : `${plan.predictionsPerDay} predictions/day`}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <span className="text-3xl font-bold">KES {plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {!user ? (
                  <Button asChild className="w-full" variant={isPopular ? 'default' : 'outline'}>
                    <Link to="/auth">
                      <Lock className="mr-2 h-4 w-4" />
                      Login to Subscribe
                    </Link>
                  </Button>
                ) : isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className={`w-full ${isPopular ? 'bg-gradient-to-r ' + plan.color : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {subscribing === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
