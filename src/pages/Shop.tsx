import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SUBSCRIPTION_PLANS } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { PaymentDialog } from "@/components/PaymentDialog";
import { MpesaPaymentDialog } from "@/components/MpesaPaymentDialog";
import { CoinShop } from "@/components/CoinShop";
import { Crown, Check, Star, Globe, Smartphone, Zap, Shield, BarChart2, Bell } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FEATURES: Record<string, { icon: typeof Check; label: string }[]> = {
  basic: [
    { icon: Zap, label: "10 AI predictions/day" },
    { icon: BarChart2, label: "Basic stats & analysis" },
    { icon: Globe, label: "5 leagues coverage" },
    { icon: Check, label: "Email support" },
  ],
  pro: [
    { icon: Zap, label: "Unlimited predictions" },
    { icon: BarChart2, label: "Advanced stats + odds" },
    { icon: Globe, label: "40+ leagues worldwide" },
    { icon: Bell, label: "Live alerts & notifications" },
    { icon: Star, label: "Value bet finder access" },
    { icon: Check, label: "Priority support" },
  ],
  vip: [
    { icon: Crown, label: "Everything in Pro" },
    { icon: Star, label: "Correct score predictions" },
    { icon: Zap, label: "AI chat unlimited" },
    { icon: Shield, label: "Prediction insurance" },
    { icon: BarChart2, label: "Expert 1-on-1 analysis" },
    { icon: Check, label: "Ad-free experience" },
  ],
};

export default function Shop() {
  const { subscription, isPremium } = useSubscription();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currency, setCurrency] = useState<"usd" | "kes">("usd");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your subscription is being activated.");
    }
  }, [searchParams]);

  const plans = SUBSCRIPTION_PLANS.map(p => ({
    ...p,
    priceKes: p.price,
    priceUsd: p.id === "basic" ? 299 : p.id === "pro" ? 599 : 999,
    displayPrice: currency === "kes" ? `KES ${p.price}` : `$${(p.id === "basic" ? 2.99 : p.id === "pro" ? 5.99 : 9.99)}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Shop | PredictPro" description="Upgrade to premium AI football predictions. Available worldwide with card payment or M-Pesa." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3">Upgrade Your Game</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join 10,000+ football fans worldwide using AI predictions to stay ahead.
          </p>
          {/* Currency toggle */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setCurrency("usd")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${currency === "usd" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
              <Globe className="h-4 w-4" /> USD ($)
            </button>
            <button onClick={() => setCurrency("kes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${currency === "kes" ? "bg-green-600 text-white border-green-600" : "hover:bg-muted"}`}>
              <Smartphone className="h-4 w-4" /> KES (M-Pesa)
            </button>
          </div>
        </div>

        <Tabs defaultValue="plans">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="coins">Buy Coins</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {isPremium() && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold">You're on the <span className="text-primary capitalize">{subscription?.plan}</span> plan</p>
                  <p className="text-sm text-muted-foreground">Expires: {new Date(subscription?.expires_at ?? "").toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map(plan => {
                const isCurrentPlan = subscription?.plan === plan.id;
                const isPopular = plan.id === "pro";
                const features = FEATURES[plan.id] ?? [];

                return (
                  <Card key={plan.id} className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : ""}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-4">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 capitalize">
                        {plan.id === "vip" && <Crown className="h-5 w-5 text-yellow-500" />}
                        {plan.id === "pro" && <Star className="h-5 w-5 text-primary" />}
                        {plan.name}
                      </CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-black text-foreground">{plan.displayPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <ul className="space-y-2">
                        {features.map(({ icon: Icon, label }) => (
                          <li key={label} className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                            {label}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4">
                        {!user ? (
                          <Link to="/auth"><Button className="w-full">Sign in to Subscribe</Button></Link>
                        ) : isCurrentPlan ? (
                          <Button className="w-full" disabled variant="outline">Current Plan ✓</Button>
                        ) : currency === "kes" ? (
                          <MpesaPaymentDialog purpose="premium_subscription" amount={plan.priceKes}
                            title={`${plan.name} Plan — M-Pesa`} buttonText={`Pay KES ${plan.priceKes}`}>
                            <Button className="w-full" variant={isPopular ? "default" : "outline"}>
                              <Smartphone className="h-4 w-4 mr-2" />Pay KES {plan.priceKes}
                            </Button>
                          </MpesaPaymentDialog>
                        ) : (
                          <PaymentDialog plan={plan.id} priceKes={plan.priceKes} priceUsd={plan.priceUsd * 100}>
                            <Button className="w-full" variant={isPopular ? "default" : "outline"}>
                              <Globe className="h-4 w-4 mr-2" />Get {plan.name}
                            </Button>
                          </PaymentDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
              <p>🔒 Payments secured by Stripe & Lipana (Safaricom) • Cancel anytime</p>
              <p>🌍 Available worldwide — USD cards, M-Pesa, Apple Pay, Google Pay</p>
            </div>
          </TabsContent>

          <TabsContent value="coins">
            <CoinShop />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
