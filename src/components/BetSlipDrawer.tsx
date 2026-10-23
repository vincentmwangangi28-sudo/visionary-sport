import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useCurrency } from '@/hooks/useCurrency';
import { triggerGuestAccountInvite } from '@/components/GuestAccountPrompt';
import {
  REGIONAL_BOOKMAKERS,
  generateRegionalBookingCode,
  translateMarketForBookmaker,
  generateMatchGameId,
  downloadSlipAsPngImage,
} from '@/services/bookmakerBookingCodes';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Trash2,
  Share2,
  Copy,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Calculator,
  Flame,
  CheckCheck,
  Globe,
  Plus,
  Vibrate,
  Download,
  ArrowLeftRight,
} from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { TeamLogo } from '@/components/TeamLogo';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { toast } from 'sonner';

export const BetSlipDrawer = () => {
  const {
    selections,
    isOpen,
    setIsOpen,
    stake,
    setStake,
    currency,
    setCurrency,
    addSelection,
    removeSelection,
    clearSlip,
    totalOdds,
    bonusMultiplier,
    potentialReturn,
    boostedReturn,
    combinedConfidence,
    getShareableSlipUrl,
    triggerHaptic,
    isHapticSupported,
  } = useBetSlip();

  const { user } = useAuth();
  const { formatOdds, t, preferences } = useUserPreferences();
  const { region } = useGeoRegion();
  const { currentConfig, setCurrency: setGlobalCurrency } = useCurrency();
  const [selectedBookmakerId, setSelectedBookmakerId] = useState(preferences.defaultBookmaker || 'sportpesa');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dynamically prioritize bookmakers matching the user's active geographic region
  const sortedBookmakers = useMemo(() => {
    return [...REGIONAL_BOOKMAKERS].sort((a, b) => {
      const aLocal = a.countryCodes?.includes(region.id) ? 1 : 0;
      const bLocal = b.countryCodes?.includes(region.id) ? 1 : 0;
      if (aLocal !== bLocal) return bLocal - aLocal;
      return 0;
    });
  }, [region.id]);

  const activeBookmaker =
    sortedBookmakers.find((b) => b.id === selectedBookmakerId) || sortedBookmakers[0];

  const { predictions } = usePredictions(1);

  // AI Recommended Next Leg Enhancer to boost the existing accumulator
  const recommendedEnhancer = useMemo(() => {
    if (selections.length === 0 || selections.length >= 15 || predictions.length === 0) return null;
    const existingTeams = new Set(
      selections.flatMap((s) => [s.homeTeam.toLowerCase(), s.awayTeam.toLowerCase()])
    );
    const candidate = predictions.find(
      (p) =>
        !existingTeams.has(p.home_team.toLowerCase()) &&
        !existingTeams.has(p.away_team.toLowerCase()) &&
        (p.confidence_score ?? p.confidence ?? 60) >= 70
    );
    if (!candidate) return null;
    const odds = candidate.home_odds ?? 1.85;
    const outcome = candidate.predicted_outcome || candidate.prediction || 'Home Win';
    const conf = candidate.confidence_score ?? candidate.confidence ?? 70;
    const newTotalOdds = totalOdds * odds;
    const boostPercent = Math.round(((newTotalOdds - totalOdds) / (totalOdds || 1)) * 100);

    return {
      prediction: candidate,
      market: outcome,
      odds,
      confidence: conf,
      newTotalOdds,
      boostPercent,
    };
  }, [selections, predictions, totalOdds]);

  // AI Recommended Stake based on fractional Kelly Criterion & currency tier
  const aiRecommendedStake = useMemo(() => {
    const p = Math.max(0.05, Math.min(0.95, combinedConfidence / 100));
    const b = Math.max(0.1, totalOdds - 1);
    const kelly = Math.max(0.02, Math.min(0.15, (p * (b + 1) - 1) / b));
    const isMajorCurrency = ['USD', 'EUR', 'GBP'].includes(currency);
    const baseBankroll = isMajorCurrency ? 100 : 5000;
    const rec = Math.round((baseBankroll * (kelly * 0.4)) / 10) * 10;
    return isMajorCurrency ? Math.max(5, Math.round(baseBankroll * (kelly * 0.25))) : Math.max(50, rec);
  }, [combinedConfidence, totalOdds, currency]);

  const handleGenerateCode = (bookieId: string) => {
    triggerHaptic('betConfirmation');
    setSelectedBookmakerId(bookieId);
    const bookie = REGIONAL_BOOKMAKERS.find((b) => b.id === bookieId) || REGIONAL_BOOKMAKERS[0];
    const code = generateRegionalBookingCode(bookieId, selections.length);
    setGeneratedCode(code);
    toast.success(`Generated ${bookie.name} booking code: ${code}`);
  };

  const handleCopyCode = (code: string) => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied code ${code} to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareableSlipUrl = useMemo(
    () => getShareableSlipUrl(selections, activeBookmaker?.name, generatedCode || undefined),
    [getShareableSlipUrl, selections, activeBookmaker?.name, generatedCode]
  );

  const formattedSlipShareText = useMemo(() => {
    return (
      `⚽ PredictPro AI Bet Slip (${selections.length} Picks)\n\n` +
      selections
        .map(
          (s, idx) =>
            `${idx + 1}. ${s.homeTeam} vs ${s.awayTeam} — ${s.market} @ ${formatOdds(s.odds)} (${s.confidence}% AI)`
        )
        .join('\n') +
      `\n\n📊 Combined Odds: ${formatOdds(totalOdds)}\n` +
      (bonusMultiplier > 0 ? `🎁 Acca Bonus: +${(bonusMultiplier * 100).toFixed(0)}%\n` : '') +
      `🎯 Combined Confidence: ${combinedConfidence}%\n` +
      (generatedCode ? `🎟️ Booking Code (${activeBookmaker.name}): ${generatedCode}\n` : '') +
      `\n👇 Click to auto-load this slip into your Bet Slip:\n${shareableSlipUrl}`
    );
  }, [selections, formatOdds, totalOdds, bonusMultiplier, combinedConfidence, generatedCode, activeBookmaker?.name, shareableSlipUrl]);

  const handleShareSlip = async () => {
    triggerHaptic('success');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PredictPro AI Bet Slip',
          text: formattedSlipShareText,
          url: shareableSlipUrl,
        });
      } catch {
        // user cancelled or fallback
      }
    } else {
      navigator.clipboard.writeText(formattedSlipShareText);
      toast.success('Copied slip & auto-load link to clipboard!');
    }
  };

  return (
    <>
      {/* Floating Trigger Button if selections exist and sheet is closed */}
      {selections.length > 0 && !isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={() => {
              triggerHaptic('selection');
              setIsOpen(true);
            }}
            aria-label={`Open Acca Bet Slip with ${selections.length} selections, total odds ${totalOdds.toFixed(2)}`}
            className="h-13 px-4 py-3 bg-primary text-primary-foreground shadow-2xl rounded-full flex items-center gap-3 border-2 border-primary-foreground/20 hover:scale-105 transition-all group"
          >
            <div className="relative">
              <Ticket className="h-5 w-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-amber-500 text-slate-950 font-black text-xs rounded-full flex items-center justify-center border-2 border-primary" aria-hidden="true">
                {selections.length}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-tight">Acca Bet Slip</p>
              <p className="text-xs opacity-90 font-medium">Odds: {totalOdds.toFixed(2)}</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Bet Slip Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Ticket className="h-5 w-5 text-primary" />
                <span>Accumulator Bet Slip</span>
                <Badge variant="secondary" className="font-bold">
                  {selections.length} {selections.length === 1 ? 'Pick' : 'Picks'}
                </Badge>
              </SheetTitle>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    toast.info('Mobile haptic tactile response is active');
                  }}
                  title="Mobile Haptic Tactile Response Active"
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md active:scale-90"
                  aria-label="Mobile Haptic Feedback Active"
                >
                  <Vibrate className="h-4 w-4" />
                </button>
                {selections.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSlip}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {selections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8 opacity-40" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">Your Bet Slip is Empty</h3>
              <p className="text-sm max-w-xs mb-6">
                Click on any odds button (Home, Draw, Away) on match cards to add selections to your multi-bet slip.
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Explore Matches
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selections List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selections.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-xl border relative group"
                  >
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                            #{idx + 1}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[170px]">{s.league}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                          <TeamLogo team={s.homeTeam} size="xs" />
                          <span className="truncate">{s.homeTeam}</span>
                          <span className="text-muted-foreground text-xs font-normal">v</span>
                          <TeamLogo team={s.awayTeam} size="xs" />
                          <span className="truncate">{s.awayTeam}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelection(s.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                        title="Remove selection"
                        aria-label={`Remove ${s.homeTeam} vs ${s.awayTeam} (${s.market}) from bet slip`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-background font-semibold text-primary">
                          {s.market}
                        </Badge>
                        {s.confidence ? (
                          <ConfidenceMeter confidence={s.confidence} variant="compact" />
                        ) : null}
                      </div>
                      <div className="font-black text-sm text-foreground">
                        @ {formatOdds(s.odds)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Multi-Leg Bonus Notification */}
                {bonusMultiplier > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5">
                    <Flame className="h-5 w-5 text-amber-500 flex-shrink-0 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        +{(bonusMultiplier * 100).toFixed(0)}% {t('slip.acca_boost', 'Accumulator Payout Boost Active!')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selections.length >= 8 ? 'Master Booster tier applied' : 'Add more legs for up to 50% extra bonus'}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Recommended Acca Enhancer */}
                {recommendedEnhancer && (
                  <div className="bg-primary/5 border border-primary/25 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Acca Enhancer
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        +{recommendedEnhancer.boostPercent}% Payout Boost
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-foreground">
                          {recommendedEnhancer.prediction.home_team} vs {recommendedEnhancer.prediction.away_team}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Pick: <strong className="text-foreground">{recommendedEnhancer.market}</strong> @ {formatOdds(recommendedEnhancer.odds)} · AI {recommendedEnhancer.confidence}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          addSelection({
                            match: `${recommendedEnhancer.prediction.home_team} vs ${recommendedEnhancer.prediction.away_team}`,
                            homeTeam: recommendedEnhancer.prediction.home_team,
                            awayTeam: recommendedEnhancer.prediction.away_team,
                            league: recommendedEnhancer.prediction.league,
                            matchDate: recommendedEnhancer.prediction.match_date,
                            market: recommendedEnhancer.market,
                            odds: recommendedEnhancer.odds,
                            confidence: recommendedEnhancer.confidence,
                          });
                        }}
                        className="h-7 px-2.5 text-xs font-bold shrink-0 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Leg
                      </Button>
                    </div>
                  </div>
                )}

                {/* 1-Click Booking Codes Across Global Bookmakers */}
                <div className="mt-4 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" /> {t('slip.export_code', 'Global Bookmaker Code Exporter')}
                    </p>
                    <Link
                      to="/slip-generator"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Converter Hub
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/20 rounded-lg border">
                    {sortedBookmakers.map((bookie) => {
                      const isRegional = bookie.countryCodes?.includes(region.id);
                      return (
                        <Button
                          key={bookie.id}
                          variant={selectedBookmakerId === bookie.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleGenerateCode(bookie.id)}
                          title={`Generate booking code for ${bookie.name}`}
                          className={`text-[11px] h-6 px-2 gap-1 ${isRegional ? 'border-primary/40 font-semibold' : ''}`}
                        >
                          <span aria-hidden="true">{bookie.flag}</span>
                          <span>{bookie.name}</span>
                          {isRegional && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-0.5" aria-hidden="true" />
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {generatedCode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-2 mt-2 animate-in fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <span aria-hidden="true">{activeBookmaker.flag}</span> {activeBookmaker.name} Slip Code
                          </p>
                          <p className="font-mono font-bold text-sm tracking-wider text-primary">{generatedCode}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyCode(generatedCode)}
                            title={`Copy ${activeBookmaker.name} slip code: ${generatedCode}`}
                            className="h-8 gap-1 text-xs font-semibold"
                          >
                            {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                            {copied ? t('slip.copied', 'Copied') : 'Copy'}
                          </Button>
                          <a
                            href={activeBookmaker.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${activeBookmaker.name} website`}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium border bg-background hover:bg-muted h-8 px-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      </div>

                      {/* Exact Bookmaker Market & 4-Digit Game ID Checklist */}
                      <div className="pt-2 border-t border-primary/15 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {activeBookmaker.name} Fast-Entry Coupon Checklist
                        </p>
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {selections.map((s) => {
                            const gameId = generateMatchGameId(s.homeTeam, s.awayTeam, activeBookmaker.id);
                            const translated = translateMarketForBookmaker(s.market, activeBookmaker.id);
                            return (
                              <div key={s.id} className="flex items-center justify-between text-[11px] bg-background/70 px-2 py-1 rounded border border-border/50">
                                <span className="truncate max-w-[160px] font-medium">
                                  <strong className="font-mono text-primary mr-1">#{gameId}</strong>
                                  {s.homeTeam} v {s.awayTeam}
                                </span>
                                <span className="font-mono font-bold text-foreground shrink-0 ml-1">
                                  {translated}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary and Calculation Footer */}
              <div className="p-4 border-t bg-card/90 backdrop-blur space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">{t('slip.total_odds', 'Combined Odds')}</span>
                    <span className="text-base font-black text-foreground">{formatOdds(totalOdds)}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">{t('slip.ai_probability', 'AI Probability')}</span>
                    <span className={`text-base font-black ${combinedConfidence > 40 ? 'text-green-600' : 'text-amber-600'}`}>
                      {combinedConfidence}%
                    </span>
                  </div>
                </div>

                {/* Stake Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="betslip-stake-input" className="font-medium text-muted-foreground">{t('slip.stake', 'Stake Amount')}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStake(aiRecommendedStake);
                          toast.success(`AI Recommended Stake applied: ${currency} ${aiRecommendedStake}`);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Stake: {currency} {aiRecommendedStake}
                      </button>
                      <div className="flex gap-1" role="group" aria-label="Select currency">
                        {Array.from(new Set([currentConfig.code, 'USD', 'EUR', 'GBP', 'KES', 'NGN'])).slice(0, 4).map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => {
                              triggerHaptic('selection');
                              setCurrency(c);
                              setGlobalCurrency(c as any);
                            }}
                            title={`Set currency to ${c}`}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${currency === c || currentConfig.code === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="betslip-stake-input"
                      type="number"
                      min="10"
                      step="10"
                      value={stake || ''}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                      className="font-bold text-base pr-16"
                      aria-label="Stake amount"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">{currency}</span>
                  </div>
                </div>

                {/* Payout Calculation */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{t('slip.est_return', 'Estimated Return')}</span>
                    <span className="text-sm font-bold">
                      {currency} {potentialReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  {bonusMultiplier > 0 && (
                    <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      <span>+{(bonusMultiplier * 100).toFixed(0)}% Boosted Total</span>
                      <span className="font-black text-sm">
                        {currency} {boostedReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Share / WhatsApp / Telegram / Export */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(formattedSlipShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp Slip
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareableSlipUrl)}&text=${encodeURIComponent(formattedSlipShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Telegram Slip
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleShareSlip} className="flex-1 gap-1.5 h-9 text-xs font-bold shadow-md">
                    <Share2 className="h-3.5 w-3.5" /> {t('slip.share', 'Share Link')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      triggerHaptic('success');
                      downloadSlipAsPngImage({
                        selections,
                        totalOdds,
                        stake,
                        currency,
                        potentialReturn: bonusMultiplier > 0 ? boostedReturn : potentialReturn,
                        bookmakerName: activeBookmaker.name,
                        bookingCode: generatedCode || generateRegionalBookingCode(activeBookmaker.id, selections.length),
                      });
                      toast.success('Downloaded high-DPI Slip Card PNG!');
                    }}
                    className="gap-1.5 h-9 text-xs font-semibold"
                    title="Save Slip as High-DPI PNG Card"
                  >
                    <Download className="h-3.5 w-3.5" /> Save PNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateCode(selectedBookmakerId)}
                    className="gap-1.5 h-9 text-xs"
                    title="Export Booking Code"
                  >
                    <Copy className="h-3.5 w-3.5" /> {t('slip.export_code', 'Code')}
                  </Button>
                </div>

                {!user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      triggerGuestAccountInvite();
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">
                        Save this {selections.length}-leg slip to a Free Account
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                      +50 Coins
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
