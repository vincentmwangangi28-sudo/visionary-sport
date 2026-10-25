import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Ticket,
  Lock,
  Sparkles,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ClipboardPaste,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CuratedBookingCode {
  id: string;
  tier: '2.00 Sure Rollover' | '5.00 Smart Acca' | '10.00 Weekend VIP' | '17-Game Mega Jackpot';
  bookmaker: 'SportyBet' | '1xBet' | 'Bet9ja' | 'SportPesa' | 'Betway' | 'MozzartBet';
  code: string;
  totalOdds: string;
  legs: number;
  expiryTime: string;
  verified: boolean;
}

export interface JackpotOverrideItem {
  gameNo: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  singlePick: '1' | 'X' | '2';
  doubleCover: 'None (Banker)' | '1X' | 'X2' | '12';
  confidence: number;
  isBankerLock: boolean;
}

export const DEFAULT_BOOKING_CODES: CuratedBookingCode[] = [
  {
    id: 'code-1',
    tier: '2.00 Sure Rollover',
    bookmaker: 'SportyBet',
    code: 'BC8942X',
    totalOdds: '2.14',
    legs: 2,
    expiryTime: 'Today 19:45 UTC',
    verified: true,
  },
  {
    id: 'code-2',
    tier: '2.00 Sure Rollover',
    bookmaker: '1xBet',
    code: 'PRD26X',
    totalOdds: '2.18',
    legs: 2,
    expiryTime: 'Today 19:45 UTC',
    verified: true,
  },
  {
    id: 'code-3',
    tier: '5.00 Smart Acca',
    bookmaker: 'Bet9ja',
    code: 'B9J551092',
    totalOdds: '5.42',
    legs: 4,
    expiryTime: 'Today 20:00 UTC',
    verified: true,
  },
  {
    id: 'code-4',
    tier: '10.00 Weekend VIP',
    bookmaker: 'SportPesa',
    code: 'SP99481',
    totalOdds: '11.20',
    legs: 6,
    expiryTime: 'Tomorrow 14:00 UTC',
    verified: true,
  },
  {
    id: 'code-5',
    tier: '5.00 Smart Acca',
    bookmaker: 'Betway',
    code: 'BW77310',
    totalOdds: '5.18',
    legs: 4,
    expiryTime: 'Today 20:30 UTC',
    verified: true,
  },
  {
    id: 'code-6',
    tier: '2.00 Sure Rollover',
    bookmaker: 'MozzartBet',
    code: 'MZ44219',
    totalOdds: '2.09',
    legs: 2,
    expiryTime: 'Today 19:45 UTC',
    verified: true,
  },
];

export const DEFAULT_JACKPOT_POOL: JackpotOverrideItem[] = [
  { gameNo: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', singlePick: '1', doubleCover: 'None (Banker)', confidence: 84, isBankerLock: true },
  { gameNo: 2, homeTeam: 'Brighton', awayTeam: 'Aston Villa', league: 'Premier League', singlePick: 'X', doubleCover: '1X', confidence: 68, isBankerLock: false },
  { gameNo: 3, homeTeam: 'Newcastle', awayTeam: 'Tottenham', league: 'Premier League', singlePick: '1', doubleCover: '12', confidence: 73, isBankerLock: false },
  { gameNo: 4, homeTeam: 'Real Sociedad', awayTeam: 'Villarreal', league: 'LaLiga', singlePick: '1', doubleCover: '1X', confidence: 71, isBankerLock: false },
  { gameNo: 5, homeTeam: 'Atalanta', awayTeam: 'Fiorentina', league: 'Serie A', singlePick: '1', doubleCover: 'None (Banker)', confidence: 82, isBankerLock: true },
  { gameNo: 6, homeTeam: 'Eintracht Frankfurt', awayTeam: 'VfB Stuttgart', league: 'Bundesliga', singlePick: '2', doubleCover: 'X2', confidence: 69, isBankerLock: false },
  { gameNo: 7, homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'FKF Premier League', singlePick: '1', doubleCover: 'None (Banker)', confidence: 86, isBankerLock: true },
  { gameNo: 8, homeTeam: 'Mamelodi Sundowns', awayTeam: 'Orlando Pirates', league: 'South Africa PSL', singlePick: '1', doubleCover: '1X', confidence: 79, isBankerLock: true },
];

export const AdminJackpotAndCodesManagerTab: React.FC = () => {
  const [codes, setCodes] = useState<CuratedBookingCode[]>(() => {
    try {
      const saved = localStorage.getItem('predictpro_admin_booking_codes');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKING_CODES;
    } catch {
      return DEFAULT_BOOKING_CODES;
    }
  });

  const [jackpotPool, setJackpotPool] = useState<JackpotOverrideItem[]>(() => {
    try {
      const saved = localStorage.getItem('predictpro_admin_jackpot_pool');
      return saved ? JSON.parse(saved) : DEFAULT_JACKPOT_POOL;
    } catch {
      return DEFAULT_JACKPOT_POOL;
    }
  });

  const [newTier, setNewTier] = useState<CuratedBookingCode['tier']>('2.00 Sure Rollover');
  const [newBookmaker, setNewBookmaker] = useState<CuratedBookingCode['bookmaker']>('SportyBet');
  const [newCode, setNewCode] = useState('');
  const [newOdds, setNewOdds] = useState('2.15');
  const [newLegs, setNewLegs] = useState(2);

  // Smart Bulk Paste state
  const [bulkPasteText, setBulkPasteText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('predictpro_admin_booking_codes', JSON.stringify(codes));
    } catch {
      // ignore
    }
  }, [codes]);

  useEffect(() => {
    try {
      localStorage.setItem('predictpro_admin_jackpot_pool', JSON.stringify(jackpotPool));
    } catch {
      // ignore
    }
  }, [jackpotPool]);

  const handleAddBookingCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      toast.error('Please enter a valid booking code');
      return;
    }
    const item: CuratedBookingCode = {
      id: `code-${Date.now()}`,
      tier: newTier,
      bookmaker: newBookmaker,
      code: newCode.trim().toUpperCase(),
      totalOdds: newOdds,
      legs: newLegs,
      expiryTime: 'Today 21:00 UTC',
      verified: true,
    };
    setCodes([item, ...codes]);
    setNewCode('');
    toast.success(`Published ${newBookmaker} code ${item.code} (${newTier})`);
  };

  /**
   * Smart Bulk Paste Parser:
   * Accepts lines or pipe-separated strings like:
   * SportyBet: BC8942X (2.14)
   * 1xBet: PRD26X (5.40)
   * Bet9ja: B9J551092
   */
  const handleBulkPasteImport = () => {
    if (!bulkPasteText.trim()) {
      toast.error('Paste your booking codes first');
      return;
    }

    const segments = bulkPasteText
      .split(/[\n|;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedItems: CuratedBookingCode[] = [];

    segments.forEach((seg, idx) => {
      const lower = seg.toLowerCase();
      let bookmaker: CuratedBookingCode['bookmaker'] = 'SportyBet';
      if (lower.includes('1xbet') || lower.includes('1x')) bookmaker = '1xBet';
      else if (lower.includes('bet9ja') || lower.includes('9ja')) bookmaker = 'Bet9ja';
      else if (lower.includes('sportpesa') || lower.includes('pesa')) bookmaker = 'SportPesa';
      else if (lower.includes('betway')) bookmaker = 'Betway';
      else if (lower.includes('mozzart')) bookmaker = 'MozzartBet';

      // Extract odds in parentheses or after @
      const oddsMatch = seg.match(/(?:\(|@|odds[:\s]*)(\d+(?:\.\d+)?)/i);
      const oddsVal = oddsMatch ? oddsMatch[1] : '2.20';
      const numOdds = parseFloat(oddsVal);

      let tier: CuratedBookingCode['tier'] = '2.00 Sure Rollover';
      let legs = 2;
      if (numOdds >= 8) {
        tier = '10.00 Weekend VIP';
        legs = 6;
      } else if (numOdds >= 3.5) {
        tier = '5.00 Smart Acca';
        legs = 4;
      }

      // Extract alphanumeric booking code token (4 to 12 chars)
      const cleaned = seg
        .replace(/sportybet|1xbet|bet9ja|sportpesa|betway|mozzartbet/gi, '')
        .replace(/\(\d+(?:\.\d+)?\)/g, '');
      const codeMatch = cleaned.match(/\b([A-Z0-9-]{4,14})\b/i);
      if (codeMatch) {
        parsedItems.push({
          id: `bulk-${Date.now()}-${idx}`,
          tier,
          bookmaker,
          code: codeMatch[1].toUpperCase(),
          totalOdds: oddsVal,
          legs,
          expiryTime: 'Today 21:00 UTC',
          verified: true,
        });
      }
    });

    if (parsedItems.length === 0) {
      toast.error('Could not detect valid booking codes. Use format: SportyBet: BC8942X (2.15)');
      return;
    }

    setCodes([...parsedItems, ...codes]);
    setBulkPasteText('');
    toast.success(`Successfully parsed & published ${parsedItems.length} booking codes!`);
  };

  const handleDeleteCode = (id: string) => {
    setCodes(codes.filter((c) => c.id !== id));
    toast.info('Booking code removed');
  };

  const toggleBankerLock = (gameNo: number) => {
    setJackpotPool(
      jackpotPool.map((item) =>
        item.gameNo === gameNo
          ? {
              ...item,
              isBankerLock: !item.isBankerLock,
              doubleCover: !item.isBankerLock ? 'None (Banker)' : '1X',
            }
          : item
      )
    );
    toast.success(`Updated Banker Lock for Jackpot Game #${gameNo}`);
  };

  const cycleSinglePick = (gameNo: number) => {
    const order: Array<'1' | 'X' | '2'> = ['1', 'X', '2'];
    setJackpotPool(
      jackpotPool.map((item) => {
        if (item.gameNo !== gameNo) return item;
        const next = order[(order.indexOf(item.singlePick) + 1) % order.length];
        return { ...item, singlePick: next };
      })
    );
  };

  const handlePublishJackpotOverrides = () => {
    localStorage.setItem('predictpro_admin_jackpot_pool', JSON.stringify(jackpotPool));
    toast.success('17-Game Mega Jackpot & Midweek Jackpot locks synced to public Jackpot Optimizer');
  };

  // Ready-to-Paste Social Broadcast Messages (Telegram / WhatsApp / X)
  const socialBroadcastText = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const codeLines = codes
      .slice(0, 6)
      .map((c) => `✅ *${c.bookmaker}* (${c.tier} - ${c.totalOdds} Odds): \`${c.code}\``)
      .join('\n');

    const bankerLines = jackpotPool
      .filter((j) => j.isBankerLock)
      .map((j) => `🔒 Game #${j.gameNo}: *${j.homeTeam} vs ${j.awayTeam}* → Pick *${j.singlePick}* (${j.confidence}% AI Confidence)`)
      .join('\n');

    return `🔥 *PREDICTPRO DAILY STATISTICAL SLIPS & JACKPOT BANKERS (${todayStr})* 🔥

🎟 *VERIFIED BOOKING CODES (1-TAP COPY):*
${codeLines}

🏆 *17-GAME MEGA JACKPOT LOCKED BANKERS:*
${bankerLines}

📊 *Convert any code across SportyBet, 1xBet, Bet9ja & SportPesa + view full 6x6 Poisson Score Matrices:*
👉 https://predictpro.guru/slip-generator`;
  }, [codes, jackpotPool]);

  return (
    <div className="space-y-6">
      {/* Fast Bulk Paste Importer + 1-Click Social Broadcast Copy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-emerald-500" />
              1-Click Bulk Paste Booking Code Importer
            </CardTitle>
            <CardDescription className="text-xs">
              Just paste your raw list of codes (e.g. <code>SportyBet: BC8942X (2.14) | 1xBet: PRD26X (5.40)</code>) and click Parse &amp; Publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              rows={4}
              value={bulkPasteText}
              onChange={(e) => setBulkPasteText(e.target.value)}
              placeholder={`SportyBet: BC8942X (2.14)\n1xBet: PRD26X (2.18)\nBet9ja: B9J551092 (5.42)\nSportPesa: SP99481 (11.20)`}
              className="w-full rounded-lg border bg-background p-3 text-xs font-mono"
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setBulkPasteText(
                    `SportyBet: SB9081K (2.16)\n1xBet: 1X8841M (2.21)\nBet9ja: B9J77312 (5.45)\nSportPesa: SP66109 (10.80)`
                  )
                }
                className="text-xs h-8"
              >
                Load Sample Paste
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleBulkPasteImport}
                className="gap-1.5 text-xs h-8"
              >
                <Sparkles className="w-3.5 h-3.5" /> Parse &amp; Publish All Codes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-sky-500" />
                  Ready-to-Paste Telegram / WhatsApp Daily Broadcast
                </CardTitle>
                <CardDescription className="text-xs">
                  Auto-generated from your active Booking Codes and Jackpot Bankers below.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(socialBroadcastText);
                  toast.success('Copied formatted broadcast! Paste directly into Telegram or WhatsApp.');
                }}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Broadcast
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg border bg-background/90 p-3 text-[11px] whitespace-pre-wrap font-mono max-h-40 overflow-y-auto leading-relaxed">
              {socialBroadcastText}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Verified Daily Booking Code Seeder */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-500" />
                Verified Daily Booking Code Seeder (Synced Live to /slip-generator)
              </CardTitle>
              <CardDescription className="text-xs">
                Publish official daily booking codes for the 2.00 Sure Rollover, 5.00 Smart Acca, and 10.00 Weekend VIP slips.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs">
              {codes.length} Active Verified Codes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={handleAddBookingCode}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 rounded-xl border bg-muted/20"
          >
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Slip Tier</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as CuratedBookingCode['tier'])}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
              >
                <option value="2.00 Sure Rollover">2.00 Sure Rollover</option>
                <option value="5.00 Smart Acca">5.00 Smart Acca</option>
                <option value="10.00 Weekend VIP">10.00 Weekend VIP</option>
                <option value="17-Game Mega Jackpot">17-Game Mega Jackpot</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Bookmaker</label>
              <select
                value={newBookmaker}
                onChange={(e) => setNewBookmaker(e.target.value as CuratedBookingCode['bookmaker'])}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
              >
                <option value="SportyBet">SportyBet</option>
                <option value="1xBet">1xBet</option>
                <option value="Bet9ja">Bet9ja</option>
                <option value="SportPesa">SportPesa</option>
                <option value="Betway">Betway</option>
                <option value="MozzartBet">MozzartBet</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Booking Code</label>
              <input
                type="text"
                placeholder="e.g. BC8942X"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Combined Odds</label>
              <input
                type="text"
                value={newOdds}
                onChange={(e) => setNewOdds(e.target.value)}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Legs Count</label>
              <input
                type="number"
                min={1}
                max={25}
                value={newLegs}
                onChange={(e) => setNewLegs(Number(e.target.value) || 2)}
                className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" className="w-full h-9 gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Publish Code
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {codes.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {item.bookmaker}
                  </Badge>
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {item.totalOdds} Odds
                  </span>
                </div>
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <code className="text-sm font-black tracking-wider text-foreground">{item.code}</code>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.code);
                        toast.success(`Copied ${item.code}`);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCode(item.id)}
                      className="p-1 text-rose-500/80 hover:text-rose-500"
                      title="Delete code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{item.tier}</span>
                  <span>{item.legs} Legs</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: 17-Game Mega Jackpot Banker Lock & Double Chance Curator */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                17-Game Mega Jackpot &amp; Midweek Jackpot Banker Curator
              </CardTitle>
              <CardDescription className="text-xs">
                Override single picks (1 / X / 2), lock high-confidence Bankers, and assign Double Chance (1X / X2 / 12) hedges.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handlePublishJackpotOverrides} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Sync Jackpot Locks Live
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Fixture</th>
                  <th className="py-2.5 px-3">Competition</th>
                  <th className="py-2.5 px-3">Primary Pick (Click to Cycle)</th>
                  <th className="py-2.5 px-3">Double Cover</th>
                  <th className="py-2.5 px-3">AI Confidence</th>
                  <th className="py-2.5 px-3 text-right">Banker Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jackpotPool.map((row) => (
                  <tr key={row.gameNo} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-bold">#{row.gameNo}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      {row.homeTeam} <span className="text-muted-foreground">vs</span> {row.awayTeam}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{row.league}</td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => cycleSinglePick(row.gameNo)}
                        className="px-2.5 py-1 rounded-md font-mono font-black bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                      >
                        Pick: {row.singlePick}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{row.doubleCover}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-500">{row.confidence}%</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant={row.isBankerLock ? 'default' : 'outline'}
                        onClick={() => toggleBankerLock(row.gameNo)}
                        className="h-7 text-[11px] gap-1"
                      >
                        {row.isBankerLock ? (
                          <>
                            <Lock className="w-3 h-3" /> Locked Banker
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Hedge / Double
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
