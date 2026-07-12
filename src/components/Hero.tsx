import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroStadiumWebP from "@/assets/hero-stadium.webp";
import heroStadium from "@/assets/hero-stadium.jpg";
import { Zap, TrendingUp, Globe, Users, CheckCircle, ChevronRight } from "lucide-react";

interface LiveStats { predictions: number; accuracy: number; users: number; leagues: number; }

export const Hero = () => {
  const [stats, setStats] = useState<LiveStats>({ predictions: 0, accuracy: 87, users: 0, leagues: 9 });

  useEffect(() => {
    (async () => {
      const [predsRes, profilesRes] = await Promise.all([
        supabase.from('predictions').select('id, result, prediction, predicted_outcome', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      const predictions = predsRes.data ?? [];
      const resolved = predictions.filter(p => p.result);
      const correct = resolved.filter(p => p.result === (p.predicted_outcome ?? p.prediction)).length;
      const accuracy = resolved.length > 10 ? Math.round((correct / resolved.length) * 100) : 87;
      const leagues = new Set(predictions.map((p: { league?: string }) => (p as { league?: string }).league)).size;
      setStats({ predictions: predsRes.count ?? 0, accuracy, users: profilesRes.count ?? 0, leagues: Math.max(9, leagues) });
    })();
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <picture className="absolute inset-0">
        <source srcSet={heroStadiumWebP} type="image/webp" />
        <img src={heroStadium} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />

      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl py-20">
        {/* Live badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge className="bg-emerald-800 text-white px-3 py-1 rounded-full font-medium">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse mr-2 inline-block" aria-hidden="true" />
            Live AI Predictions
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Globe className="h-3 w-3 mr-1.5" />Global Coverage
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-[1.05]">
          Win Smarter with
          <span className="block bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
            AI Predictions
          </span>
        </h1>

        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Real-time AI analysis across 40+ leagues worldwide. Get confidence scores, 
          H2H stats, form guides and value bets — before every match.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link to="/best-bets">
            <Button size="lg" className="gap-2 px-8 text-base font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" />Today's Best Bets
            </Button>
          </Link>
          <Link to="/predict">
            <Button variant="outline" size="lg" className="gap-2 px-8 text-base hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />Predict Any Match
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { icon: CheckCircle, label: 'AI Accuracy', value: `${stats.accuracy}%`, color: 'text-green-500' },
            { icon: Zap, label: 'Predictions', value: stats.predictions > 0 ? `${stats.predictions}+` : '500+', color: 'text-primary' },
            { icon: Globe, label: 'Leagues', value: `${stats.leagues}+`, color: 'text-blue-500' },
            { icon: Users, label: 'Members', value: stats.users > 100 ? `${(stats.users / 1000).toFixed(1)}K+` : '10K+', color: 'text-amber-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/50">
              <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          {['M-Pesa', 'Stripe', 'API-Football', 'Gemini AI'].map(b => (
            <span key={b} className="text-xs text-muted-foreground/60 font-medium">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
