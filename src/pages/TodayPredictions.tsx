import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Flame, ShieldCheck, Zap, ArrowRight, Clock } from 'lucide-react';

export default function TodayPredictions() {
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Today's Football Predictions: Daily AI Match Tips & Odds"
        description="Free football predictions for today's fixtures. Verified Expected Goals (xG) models, 1X2 win probabilities, BTTS tips, and banker picks updated hourly."
        canonical="/today-predictions"
        keywords="todays football predictions, football predictions today, soccer tips today, sure wins today, match predictions today, banker bets today"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl space-y-8">
        <Breadcrumbs className="mb-2" />

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge className="bg-primary/15 text-primary border-primary/30 font-bold px-3 py-1">
            <Clock className="w-3.5 h-3.5 mr-1" /> UPDATED LIVE FOR {todayFormatted.toUpperCase()}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Today&apos;s Football Predictions
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Every active fixture kicking off today analyzed by our Dixon-Coles Bivariate Poisson engine. Compare 1X2 win probabilities, Over/Under 2.5 goal expectancies, and confirmed starting lineup adjustments.
          </p>
        </div>

        {/* Quick Market Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link to="/sure-win-predictions">
            <Card className="hover:border-emerald-500/50 transition-all bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">88%+ Strike</div>
                  <div className="text-xs font-black text-foreground">Sure Wins Today</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/bet-of-the-day">
            <Card className="hover:border-primary/50 transition-all bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">#1 Daily Lock</div>
                  <div className="text-xs font-black text-foreground">Bet of the Day</div>
                </div>
                <Flame className="w-4 h-4 text-orange-500" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/over-1-5-goals-predictions">
            <Card className="hover:border-orange-500/50 transition-all bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Acca Anchor</div>
                  <div className="text-xs font-black text-foreground">Over 1.5 Goals</div>
                </div>
                <Zap className="w-4 h-4 text-amber-500" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/tomorrow-predictions">
            <Card className="hover:border-sky-500/50 transition-all bg-card/60">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Early Lines</div>
                  <div className="text-xs font-black text-foreground">Tomorrow&apos;s Tips</div>
                </div>
                <Calendar className="w-4 h-4 text-sky-500" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Predictions Feed */}
        <PredictionsDashboard initialDateFilter="today" />

        {/* SEO Strategy Guide */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl md:text-2xl font-black">
            How We Calculate Today&apos;s Football Match Probabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1.5">
              <strong className="text-foreground text-sm block">1. Lineup & Injury Sync (60 Mins Pre-Kickoff)</strong>
              Our models ingest confirmed starting XIs to recalculate attacking Expected Goals (xG) if a primary striker or creative playmaker is rested.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1.5">
              <strong className="text-foreground text-sm block">2. Sharp Money & Steam Tracking</strong>
              We monitor Pinnacle and Asian market volume movements throughout the morning to detect institutional syndicate positions.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1.5">
              <strong className="text-foreground text-sm block">3. Weather & Pitch Conditions</strong>
              Heavy precipitation and high wind speeds automatically adjust Under 2.5 Goals and Corner Kick expectations in real time.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
