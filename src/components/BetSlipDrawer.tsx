import { useState } from 'react';
import { useBetSlip } from '@/hooks/useBetSlip';
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
  CheckCheck
} from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';
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
    removeSelection,
    clearSlip,
    totalOdds,
    bonusMultiplier,
    potentialReturn,
    boostedReturn,
    combinedConfidence,
    generateBookingCode,
  } = useBetSlip();

  const [selectedBookmaker, setSelectedBookmaker] = useState('SportyBet');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bookmakers = ['SportyBet', 'Betway', '1xBet', 'Bet365', '22Bet'];

  const handleGenerateCode = (bookie: string) => {
    setSelectedBookmaker(bookie);
    const code = generateBookingCode(bookie);
    setGeneratedCode(code);
    toast.success(`Generated ${bookie} booking code: ${code}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied code ${code} to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareSlip = async () => {
    const slipText = `⚽ 𝗣𝗿𝗲𝗱𝗶𝗰𝘁𝗣𝗿𝗼 𝗔𝗜 𝗕𝗲𝘁 𝗦𝗹𝗶𝗽 (${selections.length} Picks)\n\n` +
      selections.map((s, idx) => `${idx + 1}. ${s.homeTeam} vs ${s.awayTeam}\n   👉 Pick: ${s.market} @ ${s.odds.toFixed(2)} (AI: ${s.confidence}%)\n   🏆 ${s.league}`).join('\n\n') +
      `\n\n📊 𝗧𝗼𝘁𝗮𝗹 𝗢𝗱𝗱𝘀: ${totalOdds.toFixed(2)}\n` +
      (bonusMultiplier > 0 ? `🎁 𝗔𝗰𝗰𝗮 𝗕𝗼𝗻𝘂𝘀: +${(bonusMultiplier * 100).toFixed(0)}%\n` : '') +
      `🎯 𝗖𝗼𝗺𝗯𝗶𝗻𝗲𝗱 𝗖𝗼𝗻𝗳𝗶𝗱𝗲𝗻𝗰𝗲: ${combinedConfidence}%\n` +
      (generatedCode ? `🎟️ 𝗕𝗼𝗼𝗸𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 (${selectedBookmaker}): ${generatedCode}\n` : '') +
      `\n🔗 Built with PredictPro AI — https://predictpro.guru`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PredictPro AI Bet Slip',
          text: slipText,
        });
      } catch {
        // user cancelled or fallback
      }
    } else {
      navigator.clipboard.writeText(slipText);
      toast.success('Bet slip copied to clipboard!');
    }
  };

  return (
    <>
      {/* Floating Trigger Button if selections exist and sheet is closed */}
      {selections.length > 0 && !isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={() => setIsOpen(true)}
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
                        <span className="text-muted-foreground text-[11px]">AI: {s.confidence}%</span>
                      </div>
                      <div className="font-black text-sm text-foreground">
                        @ {s.odds.toFixed(2)}
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
                        +{(bonusMultiplier * 100).toFixed(0)}% Accumulator Payout Boost Active!
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selections.length >= 8 ? 'Master Booster tier applied' : 'Add more legs for up to 50% extra bonus'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 1-Click Booking Codes Across Bookmakers */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Bookmaker Code Exporter
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {bookmakers.slice(0, 3).map((bookie) => (
                      <Button
                        key={bookie}
                        variant={selectedBookmaker === bookie ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleGenerateCode(bookie)}
                        className="text-xs h-7 px-2"
                      >
                        {bookie}
                      </Button>
                    ))}
                  </div>

                  {generatedCode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between gap-2 mt-2 animate-in fade-in">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">{selectedBookmaker} Slip Code</p>
                        <p className="font-mono font-bold text-sm tracking-wider text-primary">{generatedCode}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyCode(generatedCode)}
                        className="h-8 gap-1 text-xs"
                      >
                        {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary and Calculation Footer */}
              <div className="p-4 border-t bg-card/90 backdrop-blur space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">Combined Odds</span>
                    <span className="text-base font-black text-foreground">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">AI Probability</span>
                    <span className={`text-base font-black ${combinedConfidence > 40 ? 'text-green-600' : 'text-amber-600'}`}>
                      {combinedConfidence}%
                    </span>
                  </div>
                </div>

                {/* Stake Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="betslip-stake-input" className="font-medium text-muted-foreground">Stake Amount</label>
                    <div className="flex gap-1" role="group" aria-label="Select currency">
                      {['KES', 'USD', 'NGN'].map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setCurrency(c)}
                          aria-label={`Set currency to ${c}`}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${currency === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                          {c}
                        </button>
                      ))}
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
                    <span className="text-muted-foreground font-medium">Estimated Return</span>
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleShareSlip} className="flex-1 gap-2 h-10 font-bold shadow-md">
                    <Share2 className="h-4 w-4" /> Share Slip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateCode(selectedBookmaker)}
                    className="gap-2 h-10"
                    title="Export Booking Code"
                  >
                    <Copy className="h-4 w-4" /> Export
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
