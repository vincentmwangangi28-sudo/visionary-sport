import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Copy,
  Plus,
  CheckCircle2,
  ShieldCheck,
  History,
  Sparkles,
} from 'lucide-react';
import {
  SUPPORTED_BOOKMAKERS,
  BookmakerId,
  SAMPLE_BOOKING_CODES,
  convertBookingCodeAcrossBookmakers,
  BookingCodeConversionOutput,
} from '@/services/phase13EdgeService';

const CONVERSION_HISTORY_KEY = 'predictpro_phase13_code_history_v1';

export const UniversalCodeConverterPage: React.FC = () => {
  const { addSelections, setIsOpen } = useBetSlip();

  const [sourceBookie, setSourceBookie] = useState<BookmakerId>('sportybet');
  const [targetBookie, setTargetBookie] = useState<BookmakerId>('betika');
  const [bookingCodeInput, setBookingCodeInput] = useState<string>('SB-88492A');

  const [recentConversions, setRecentConversions] = useState<
    Array<{ sourceCode: string; targetCode: string; sourceName: string; targetName: string; totalOdds: number }>
  >(() => {
    try {
      const saved = localStorage.getItem(CONVERSION_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const conversion: BookingCodeConversionOutput = useMemo(
    () => convertBookingCodeAcrossBookmakers(bookingCodeInput, sourceBookie, targetBookie),
    [bookingCodeInput, sourceBookie, targetBookie]
  );

  const handleSwapBookmakers = () => {
    const prevSource = sourceBookie;
    const prevTarget = targetBookie;
    setSourceBookie(prevTarget);
    setTargetBookie(prevSource);
    setBookingCodeInput(conversion.targetCode);
    toast.success(`Swapped direction: ${conversion.targetBookmaker.name} → ${conversion.sourceBookmaker.name}`);
  };

  const handleSelectSample = (code: string, bookie: BookmakerId) => {
    setSourceBookie(bookie);
    if (targetBookie === bookie) {
      setTargetBookie(bookie === 'sportybet' ? 'betika' : 'sportybet');
    }
    setBookingCodeInput(code);
    toast.success(`Loaded sample code ${code}`);
  };

  const handleCopyTargetCode = () => {
    navigator.clipboard.writeText(conversion.targetCode);
    const record = {
      sourceCode: conversion.sourceCode,
      targetCode: conversion.targetCode,
      sourceName: conversion.sourceBookmaker.name,
      targetName: conversion.targetBookmaker.name,
      totalOdds: conversion.targetTotalOdds,
    };
    const nextHistory = [
      record,
      ...recentConversions.filter((r) => r.targetCode !== record.targetCode),
    ].slice(0, 6);
    setRecentConversions(nextHistory);
    try {
      localStorage.setItem(CONVERSION_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore
    }
    toast.success(`Copied ${conversion.targetBookmaker.name} code: ${conversion.targetCode}`);
  };

  const handleLoadConvertedToSlip = () => {
    const items = conversion.legs.map((leg) => ({
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      match: `${leg.homeTeam} vs ${leg.awayTeam}`,
      league: leg.league,
      market: leg.targetMarketLabel,
      selection: leg.targetMarketLabel,
      odds: leg.targetOdds,
      confidence: leg.confidence,
    }));
    addSelections(items);
    setIsOpen(true);
    toast.success(`Loaded ${items.length} converted legs into your Bet Slip Drawer!`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Universal Booking Code Converter & Validator | SportyBet, Betika, Bet9ja, 1xBet | PredictPro"
        description="Convert football bet booking codes between SportyBet, Betika, SportPesa, Bet9ja, 1xBet, Betway, and MozzartBet with leg-by-leg market translation and EV drift validation."
        keywords="booking code converter, sportybet to betika converter, bet9ja to sportybet code converter, 1xbet booking code converter, free bet code translator"
        canonical="/code-converter"
      />

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Universal Booking Code Converter & Validator' },
          ]}
        />

        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Cross-Bookmaker Ticket Translator</span>
                <span aria-hidden="true">·</span>
                <span>7 Regional &amp; Global Sportsbooks</span>
                <span aria-hidden="true">·</span>
                <span>No-Vig Fair Odds Audit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Universal Booking Code Converter &amp; Slip Validator
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never miss a shared accumulator because it was booked on a different sportsbook. Paste any <strong className="text-foreground">SportyBet, Betika, SportPesa, Bet9ja, 1xBet, Betway, or MozzartBet</strong> code below to map every market leg, inspect odds drift against fair no-vig lines, and push the ticket directly to your Bet Slip.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/community-slips"
                className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Browse Community Codes →
              </Link>
              <Link
                to="/tipsters"
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-colors whitespace-nowrap"
              >
                Verified Tipster Codes →
              </Link>
            </div>
          </div>

          {/* Sample Trending Codes */}
          <div className="pt-3 border-t border-border/60 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              Click a Trending Matchday Code to Test Instant Translation:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_BOOKING_CODES.map((sample) => {
                const isSelected = bookingCodeInput.toUpperCase() === sample.code.toUpperCase();
                return (
                  <button
                    key={sample.code}
                    type="button"
                    onClick={() => handleSelectSample(sample.code, sample.sourceBookie)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background/60 hover:border-border/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-extrabold text-primary">{sample.code}</span>
                      <span className="text-[11px] text-muted-foreground uppercase">
                        {sample.sourceBookie}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-1">
                      {sample.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Converter Control Bar */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Source Bookmaker */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                01. Source Bookmaker
              </label>
              <select
                aria-label="Source Bookmaker"
                value={sourceBookie}
                onChange={(e) => setSourceBookie(e.target.value as BookmakerId)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground"
              >
                {SUPPORTED_BOOKMAKERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.regions})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Booking Code Input */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                02. Source Booking Code
              </label>
              <Input
                type="text"
                value={bookingCodeInput}
                onChange={(e) => setBookingCodeInput(e.target.value)}
                placeholder="e.g. SB-88492A"
                className="font-mono uppercase font-bold"
              />
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleSwapBookmakers}
                aria-label="Swap Source and Target Bookmakers"
                className="w-full lg:w-10 h-10 p-0"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Target Bookmaker */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                03. Target Bookmaker
              </label>
              <select
                aria-label="Target Bookmaker"
                value={targetBookie}
                onChange={(e) => setTargetBookie(e.target.value as BookmakerId)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground"
              >
                {SUPPORTED_BOOKMAKERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.regions})
                  </option>
                ))}
              </select>
            </div>

            {/* Converted Output Box */}
            <div className="lg:col-span-2">
              <Button
                type="button"
                onClick={handleCopyTargetCode}
                className="w-full h-10 gap-1.5 font-mono text-xs font-extrabold"
              >
                <Copy className="h-3.5 w-3.5" />
                {conversion.targetCode}
              </Button>
            </div>
          </div>

          {/* Conversion Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60 font-mono tabular-nums">
            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="text-[11px] font-sans text-muted-foreground">
                {conversion.sourceBookmaker.name} Source Code
              </div>
              <div className="text-base font-extrabold text-foreground">
                {conversion.sourceCode} ({conversion.sourceTotalOdds.toFixed(2)}x)
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5">
              <div className="text-[11px] font-sans text-emerald-400">
                {conversion.targetBookmaker.name} Converted Code
              </div>
              <div className="text-base font-extrabold text-emerald-400">
                {conversion.targetCode} ({conversion.targetTotalOdds.toFixed(2)}x)
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="text-[11px] font-sans text-muted-foreground">
                Cross-Bookie Odds Drift
              </div>
              <div
                className={`text-base font-extrabold ${
                  conversion.oddsDeltaPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {conversion.oddsDeltaPct >= 0 ? '+' : ''}
                {conversion.oddsDeltaPct.toFixed(2)}%
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/60">
              <div className="text-[11px] font-sans text-muted-foreground">
                Max Acca Bonus ({conversion.targetBookmaker.name})
              </div>
              <div className="text-base font-extrabold text-cyan-400">
                Up to +{conversion.targetBookmaker.maxAccaBonusPct}%
              </div>
            </div>
          </div>

          {/* Leg-by-Leg Market Mapping Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 pr-3 font-semibold">Fixture &amp; Competition</th>
                  <th className="py-2.5 px-3 font-semibold">
                    {conversion.sourceBookmaker.name} Market
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    {conversion.targetBookmaker.name} Mapped Market
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">Source Odds</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Target Odds</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Mapping Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {conversion.legs.map((leg) => (
                  <tr key={`${leg.homeTeam}-${leg.awayTeam}`} className="hover:bg-muted/40">
                    <td className="py-3 pr-3">
                      <div className="font-bold text-foreground">
                        {leg.homeTeam} vs {leg.awayTeam}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {leg.league} · AI Conf {leg.confidence}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{leg.sourceMarketLabel}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {leg.targetMarketLabel}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {leg.sourceOdds.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-400">
                      {leg.targetOdds.toFixed(2)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <span className="text-[11px] font-semibold text-cyan-400">
                        {leg.matchStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleLoadConvertedToSlip} className="gap-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
                Load Converted Slip ({conversion.legs.length} Legs) to Bet Slip Drawer
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyTargetCode}
                className="gap-1.5 text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy {conversion.targetBookmaker.name} Code ({conversion.targetCode})
              </Button>
            </div>

            {recentConversions.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                <span>
                  Recent: {recentConversions[0].sourceCode} →{' '}
                  <strong className="font-mono text-foreground">
                    {recentConversions[0].targetCode}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UniversalCodeConverterPage;
