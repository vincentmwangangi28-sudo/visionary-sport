import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCheck, Share2, Send, ExternalLink, Code2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { hapticService } from '@/services/hapticService';

export interface ViralSlipItem {
  homeTeam?: string;
  awayTeam?: string;
  match?: string;
  league?: string;
  market?: string;
  pick?: string;
  odds: number;
  confidence: number;
}

interface ViralSlipShareCardProps {
  title?: string;
  slipTitle?: string;
  items?: ViralSlipItem[];
  legs?: ViralSlipItem[];
  totalOdds?: number;
  combinedConfidence?: number;
  avgConfidence?: number;
  canonicalPath?: string;
  sharePath?: string;
  defaultBookmaker?: string;
}

const BOOKMAKERS = ['SportyBet', 'Betika', 'SportPesa', 'Bet9ja', 'Betway', '1xBet'] as const;

interface NormalizedSlipItem {
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  confidence: number;
}

function normalizeSlipItems(raw: ViralSlipItem[]): NormalizedSlipItem[] {
  return (raw || []).map((item) => {
    const parts = (item.match || '').split(/\s+vs\s+/i);
    const homeTeam = item.homeTeam || parts[0] || 'Home';
    const awayTeam = item.awayTeam || parts[1] || 'Away';
    return {
      homeTeam,
      awayTeam,
      league: item.league || 'Football',
      market: item.market || item.pick || '1X2',
      odds: Number(item.odds) || 1.85,
      confidence: Number(item.confidence) || 75,
    };
  });
}

function buildDeterministicBookingCode(bookie: string, items: NormalizedSlipItem[]): string {
  const prefixMap: Record<string, string> = {
    SportyBet: 'SB',
    Betika: 'BTK',
    SportPesa: 'MJP',
    Bet9ja: 'B9J',
    Betway: 'BW',
    '1xBet': '1X',
  };
  const prefix = prefixMap[bookie] || 'PP';
  const seedStr = items.map((i) => `${i.homeTeam}-${i.awayTeam}-${i.market}`).join('|') || 'DEFAULT';
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const alnum = Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padEnd(6, '7');
  return `${prefix}-${alnum}`;
}

export const ViralSlipShareCard: React.FC<ViralSlipShareCardProps> = ({
  title: rawTitle,
  slipTitle,
  items: rawItems,
  legs: rawLegs,
  totalOdds: rawTotalOdds,
  combinedConfidence: rawCombinedConf,
  avgConfidence,
  canonicalPath: rawCanonicalPath,
  sharePath,
  defaultBookmaker = 'SportyBet',
}) => {
  const title = rawTitle || slipTitle || 'AI Multi-Bet Accumulator Slip';
  const canonicalPath = rawCanonicalPath || sharePath || '/accumulator';
  const items = useMemo(
    () => normalizeSlipItems(rawItems || rawLegs || []),
    [rawItems, rawLegs]
  );
  const totalOdds = useMemo(() => {
    if (typeof rawTotalOdds === 'number' && rawTotalOdds > 0) return rawTotalOdds;
    return items.slice(0, 12).reduce((acc, item) => acc * (item.odds || 1.5), 1);
  }, [rawTotalOdds, items]);
  const combinedConfidence = rawCombinedConf ?? avgConfidence ?? 80;

  const [selectedBookie, setSelectedBookie] = useState<string>(defaultBookmaker);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSlipText, setCopiedSlipText] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);

  const bookingCode = useMemo(
    () => buildDeterministicBookingCode(selectedBookie, items),
    [selectedBookie, items]
  );

  const shareUrl = `https://predictpro.guru${canonicalPath}`;

  const dynamicOgCardUrl = useMemo(() => {
    const params = new URLSearchParams({
      title: `${items.length}-Leg ${title}`,
      subtitle: `${selectedBookie} Code: ${bookingCode} · Combined Odds ${totalOdds.toFixed(2)}`,
      tip: items[0]
        ? `${items[0].homeTeam} vs ${items[0].awayTeam} (${items[0].market})`
        : 'Verified AI Banker Selections',
      conf: String(combinedConfidence || 82),
      code: bookingCode,
    });
    return `/api/og?${params.toString()}`;
  }, [items, title, selectedBookie, bookingCode, totalOdds, combinedConfidence]);

  const formattedShareText = useMemo(() => {
    const header = `PredictPro AI — ${items.length}-Leg ${title}`;
    const legs = items
      .slice(0, 10)
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.homeTeam} vs ${item.awayTeam} — ${item.market} @ ${item.odds.toFixed(2)} (${item.confidence}% AI)`
      )
      .join('\n');
    const moreLine = items.length > 10 ? `\n...and ${items.length - 10} more fixtures` : '';
    return `${header}\n\n${legs}${moreLine}\n\nCombined Odds: ${totalOdds.toFixed(2)}x · AI Confidence: ${combinedConfidence}%\nBooking Code (${selectedBookie}): ${bookingCode}\n\nVerify live xG & Poisson probabilities: ${shareUrl}`;
  }, [items, title, totalOdds, combinedConfidence, selectedBookie, bookingCode, shareUrl]);

  const handleCopyBookingCode = () => {
    hapticService.selection();
    navigator.clipboard.writeText(bookingCode);
    setCopiedCode(true);
    toast.success(`Copied ${selectedBookie} booking code: ${bookingCode}`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyFullSlip = () => {
    hapticService.success();
    navigator.clipboard.writeText(formattedShareText);
    setCopiedSlipText(true);
    toast.success('Copied formatted slip with PredictPro link to clipboard');
    setTimeout(() => setCopiedSlipText(false), 2500);
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(formattedShareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(formattedShareText)}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${items.length}-Leg AI Football Slip (${totalOdds.toFixed(2)}x Odds · ${combinedConfidence}% Confidence) — ${selectedBookie} Code: ${bookingCode}`
  )}&url=${encodeURIComponent(shareUrl)}`;

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Booking Code & Slip Sharing Studio"
      className="border border-border rounded-xl p-4 bg-card space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            1-Click Booking Code &amp; Slip Syndication
          </h3>
          <p className="text-xs text-muted-foreground">
            Select your bookmaker to generate an instant slip code or share formatted picks on WhatsApp &amp; Telegram.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-muted-foreground">
          <span>{items.length} Legs</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span className="text-foreground font-bold">{totalOdds.toFixed(2)}x Odds</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{combinedConfidence}% AI</span>
        </div>
      </div>

      {/* Bookmaker Segmented Selector */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-lg" role="group" aria-label="Select bookmaker for booking code">
        {BOOKMAKERS.map((bookie) => (
          <button
            key={bookie}
            type="button"
            onClick={() => {
              hapticService.selection();
              setSelectedBookie(bookie);
            }}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedBookie === bookie
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {bookie}
          </button>
        ))}
      </div>

      {/* Booking Code Row */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/70">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground font-medium">
            {selectedBookie} Instant Booking Code
          </div>
          <div className="text-lg font-mono font-black tracking-wider text-primary tabular-nums">
            {bookingCode}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyBookingCode}
            className="gap-1.5 text-xs font-semibold"
          >
            {copiedCode ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedCode ? 'Copied Code' : 'Copy Code'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={handleCopyFullSlip}
            className="gap-1.5 text-xs font-semibold"
          >
            {copiedSlipText ? <CheckCheck className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {copiedSlipText ? 'Slip Copied' : 'Copy Full Slip'}
          </Button>
        </div>
      </div>

      {/* Direct Social Share Links (Anchor tags to avoid window.open in iframe) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          WhatsApp
        </a>
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          Telegram
        </a>
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Post on X
        </a>
        <button
          type="button"
          onClick={() => setShowCardPreview(!showCardPreview)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
        >
          <Code2 className="h-3.5 w-3.5 text-primary" />
          {showCardPreview ? 'Hide OG Card' : 'Preview OG Card'}
        </button>
      </div>

      {showCardPreview && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Dynamic 1200×630 OpenGraph Social Share Card</span>
            <a
              href={dynamicOgCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono text-[11px]"
            >
              Open /api/og Image
            </a>
          </div>
          <div className="rounded-lg overflow-hidden border border-border bg-slate-950">
            <img
              src={dynamicOgCardUrl}
              alt={`${title} Social Share Card`}
              width={1200}
              height={630}
              loading="lazy"
              className="w-full h-auto block"
            />
          </div>
        </div>
      )}
    </section>
  );
};
