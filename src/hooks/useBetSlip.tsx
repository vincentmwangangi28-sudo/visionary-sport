import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { hapticService, HapticPattern } from '@/services/hapticService';

export type SlipAccumulationMode = 'standard' | 'weekly_long_bet';

export interface BetSelection {
  id: string;
  matchId?: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  kickoff?: string;
  market: string;
  selection?: string;
  marketCategory?: string;
  odds: number;
  baseOdds?: number;
  baseMarket?: string;
  confidence: number;
  dayGroup?: string;
}

export type BetSelectionInput = Omit<BetSelection, 'id' | 'match'> & {
  id?: string;
  match?: string;
};

export interface LegCumulativeStep {
  selection: BetSelection;
  legNumber: number;
  dayGroup: string;
  stepOdds: number;
  cumulativeOdds: number;
  cumulativeReturn: number;
}

interface BetSlipContextType {
  selections: BetSelection[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  slipMode: SlipAccumulationMode;
  setSlipMode: (mode: SlipAccumulationMode) => void;
  isSafetyCushionActive: boolean;
  toggleSafetyCushion: () => void;
  stake: number;
  setStake: (stake: number) => void;
  currency: string;
  setCurrency: (cur: string) => void;
  addSelection: (selection: BetSelectionInput) => void;
  addSelections: (selections: BetSelectionInput[]) => void;
  groupIntoWeeklyLongBet: (additionalSelections?: BetSelectionInput[]) => void;
  removeSelection: (id: string) => void;
  clearSlip: () => void;
  isInSlip: (idOrMatch: string, selectionOrMarket?: string) => boolean;
  isSelected: (idOrMatch: string, selectionOrMarket?: string) => boolean;
  totalOdds: number;
  bonusMultiplier: number;
  bonusAmount: number;
  potentialReturn: number;
  boostedReturn: number;
  netProfit: number;
  combinedConfidence: number;
  legProgression: LegCumulativeStep[];
  nextBonusTier: { legsNeeded: number; nextBonusPct: number } | null;
  generateBookingCode: (bookmaker: string) => string;
  getShareableSlipUrl: (customItems?: BetSelectionInput[], bookmaker?: string, bookingCode?: string) => string;
  triggerHaptic: (pattern?: HapticPattern) => boolean;
  isHapticSupported: boolean;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

const STORAGE_KEY = 'predictpro_betslip_v2';
const SLIP_MODE_STORAGE_KEY = 'predictpro_betslip_mode_v1';

export function encodeSlipToParam(items: BetSelectionInput[]): string {
  try {
    return items
      .slice(0, 15)
      .map((s) => {
        const h = (s.homeTeam || 'Home').replace(/[~|_]/g, ' ').trim();
        const a = (s.awayTeam || 'Away').replace(/[~|_]/g, ' ').trim();
        const m = (s.selection || s.market || 'Home Win').replace(/[~|_]/g, ' ').trim();
        const o = (Number(s.odds) || 1.75).toFixed(2);
        const c = Math.round(Number(s.confidence) || 78);
        const l = (s.league || 'Football').replace(/[~|_]/g, ' ').trim();
        return `${h}~${a}~${m}~${o}~${c}~${l}`;
      })
      .join('|');
  } catch {
    return '';
  }
}

export function decodeSlipFromParam(raw: string): BetSelectionInput[] {
  try {
    if (!raw) return [];
    return raw
      .split('|')
      .map((chunk) => {
        const [homeTeam, awayTeam, market, oddsStr, confStr, league] = chunk.split('~');
        if (!homeTeam || !awayTeam) return null;
        return {
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          match: `${homeTeam.trim()} vs ${awayTeam.trim()}`,
          market: (market || 'Home Win').trim(),
          odds: parseFloat(oddsStr || '1.75') || 1.75,
          confidence: parseInt(confStr || '78', 10) || 78,
          league: (league || 'Football').trim(),
        } as BetSelectionInput;
      })
      .filter((x): x is BetSelectionInput => x !== null);
  } catch {
    return [];
  }
}

function resolveDayGroup(dateStr?: string): string {
  if (!dateStr) return 'Matchday';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Matchday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return 'Matchday';
  }
}

function normalizeSelectionInput(sel: BetSelectionInput): BetSelection {
  const homeTeam = sel.homeTeam || 'Home';
  const awayTeam = sel.awayTeam || 'Away';
  const resolvedMatch = sel.match || `${homeTeam} vs ${awayTeam}`;
  const resolvedMarket = sel.selection || sel.market || 'Match Winner';
  const resolvedCategory =
    sel.selection && sel.market && sel.selection !== sel.market ? sel.market : sel.marketCategory;
  const resolvedDate = sel.matchDate || sel.kickoff;
  const resolvedMatchId = sel.matchId || sel.id;
  const id = (sel.id || `${homeTeam}-${awayTeam}-${resolvedMarket}`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const numericOdds = Number(sel.odds) || 1.5;

  return {
    ...sel,
    id,
    matchId: resolvedMatchId ? String(resolvedMatchId) : undefined,
    match: resolvedMatch,
    homeTeam,
    awayTeam,
    league: sel.league || 'Football',
    matchDate: resolvedDate,
    kickoff: sel.kickoff || resolvedDate,
    market: resolvedMarket,
    baseMarket: sel.baseMarket || resolvedMarket,
    selection: sel.selection || resolvedMarket,
    marketCategory: resolvedCategory,
    odds: numericOdds,
    baseOdds: sel.baseOdds || numericOdds,
    confidence: Number(sel.confidence) || 75,
    dayGroup: sel.dayGroup || resolveDayGroup(resolvedDate),
  };
}

export const BetSlipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selections, setSelections] = useState<BetSelection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(normalizeSelectionInput) : [];
    } catch {
      return [];
    }
  });

  const [slipMode, setSlipModeState] = useState<SlipAccumulationMode>(() => {
    try {
      const savedMode = localStorage.getItem(SLIP_MODE_STORAGE_KEY);
      return savedMode === 'weekly_long_bet' ? 'weekly_long_bet' : 'standard';
    } catch {
      return 'standard';
    }
  });

  const [isSafetyCushionActive, setIsSafetyCushionActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState<number>(100);
  const [currency, setCurrency] = useState<string>('KES');

  const setSlipMode = (mode: SlipAccumulationMode) => {
    setSlipModeState(mode);
    try {
      localStorage.setItem(SLIP_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch (e) {
      console.error(e);
    }
  }, [selections]);

  // Hydrate shared ?slip= deep-links and ?ref= referral invites
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode && refCode.trim()) {
        const cleanRef = refCode.trim().toUpperCase();
        localStorage.setItem('predictpro_referred_by', cleanRef);
        setTimeout(() => {
          toast.success(`Referral code ${cleanRef} activated! Sign in to claim +50 Free VIP Coins.`);
        }, 600);
      }

      const sharedSlipRaw = params.get('slip');
      const sharedCode = params.get('code');
      const sharedBookie = params.get('bookie');
      if (sharedSlipRaw) {
        const decoded = decodeSlipFromParam(sharedSlipRaw);
        if (decoded.length > 0) {
          const normalizedList = decoded.map(normalizeSelectionInput);
          setSelections(normalizedList);
          if (normalizedList.length >= 6) {
            setSlipMode('weekly_long_bet');
          }
          setIsOpen(true);
          setTimeout(() => {
            const codeSuffix = sharedCode ? ` (${sharedBookie || 'Code'}: ${sharedCode})` : '';
            toast.success(
              `Loaded shared ${normalizedList.length}-leg slip${codeSuffix} into your Bet Slip!`
            );
          }, 400);
        }
      }
    } catch {
      // ignore malformed URL params
    }
  }, []);

  const toggleSafetyCushion = () => {
    hapticService.selection();
    setIsSafetyCushionActive((prev) => {
      const next = !prev;
      setSelections((current) =>
        current.map((sel) => {
          const origOdds = sel.baseOdds || sel.odds;
          const origMarket = sel.baseMarket || sel.market;
          if (next) {
            const safeMarket = origMarket.toLowerCase().includes('away')
              ? `${sel.awayTeam} X2 (Double Chance)`
              : origMarket.toLowerCase().includes('over 2.5')
                ? 'Over 1.5 Goals (Safe Cushion)'
                : `${sel.homeTeam} 1X (Double Chance)`;
            const safeOdds = Number(Math.max(1.16, origOdds * 0.78).toFixed(2));
            return {
              ...sel,
              market: safeMarket,
              selection: safeMarket,
              odds: safeOdds,
              baseOdds: origOdds,
              baseMarket: origMarket,
            };
          }
          return {
            ...sel,
            market: origMarket,
            selection: origMarket,
            odds: origOdds,
          };
        })
      );
      toast.success(
        next
          ? 'Weekly Long Bet Safety Cushion enabled (1X / X2 / Over 1.5 Goals)'
          : 'Restored standard primary markets & full accumulator odds'
      );
      return next;
    });
  };

  const addSelection = (rawSel: BetSelectionInput) => {
    const normalized = normalizeSelectionInput(rawSel);
    const { id, homeTeam, awayTeam, market, odds } = normalized;

    if (selections.some((s) => s.id === id)) {
      hapticService.warning();
      toast.info(`Already added to bet slip: ${market}`);
      return;
    }

    const existingMatch = selections.find(
      (s) => s.homeTeam === homeTeam && s.awayTeam === awayTeam
    );
    if (existingMatch) {
      setSelections((prev) => prev.map((s) => (s.id === existingMatch.id ? normalized : s)));
      hapticService.selection();
      toast.success(`Updated ${homeTeam} vs ${awayTeam} to ${market}`);
      setIsOpen(true);
      return;
    }

    if (selections.length >= 20) {
      hapticService.error();
      toast.error('Maximum 20 selections per Weekly Long Bet accumulation slip.');
      return;
    }

    const newCount = selections.length + 1;
    if (newCount >= 6 && slipMode !== 'weekly_long_bet') {
      setSlipMode('weekly_long_bet');
    }

    if (newCount === 3 || newCount === 5 || newCount === 8 || newCount === 12 || newCount === 15) {
      hapticService.boost();
    } else {
      hapticService.selection();
    }

    setSelections((prev) => [...prev, normalized]);
    toast.success(`Added ${homeTeam} vs ${awayTeam} (${market} @ ${odds.toFixed(2)})`);
    setIsOpen(true);
  };

  const addSelections = (newSels: BetSelectionInput[]) => {
    if (!newSels || newSels.length === 0) return;

    setSelections((prev) => {
      const updated = [...prev];
      let addedCount = 0;

      for (const rawSel of newSels) {
        if (updated.length >= 20) break;
        const normalized = normalizeSelectionInput(rawSel);

        if (updated.some((s) => s.id === normalized.id)) continue;

        const matchIdx = updated.findIndex(
          (s) => s.homeTeam === normalized.homeTeam && s.awayTeam === normalized.awayTeam
        );
        if (matchIdx >= 0) {
          updated[matchIdx] = normalized;
          addedCount++;
        } else {
          updated.push(normalized);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        hapticService.success();
        toast.success(`Loaded ${addedCount} pick${addedCount > 1 ? 's' : ''} into Bet Slip!`);
      } else {
        hapticService.warning();
        toast.info('Selected picks are already in your Bet Slip');
      }

      if (updated.length >= 6) {
        setSlipMode('weekly_long_bet');
      }

      return updated;
    });

    setIsOpen(true);
  };

  const groupIntoWeeklyLongBet = (additionalSelections?: BetSelectionInput[]) => {
    hapticService.boost();
    setSlipMode('weekly_long_bet');

    if (additionalSelections && additionalSelections.length > 0) {
      setSelections((prev) => {
        const updated = [...prev];
        for (const rawSel of additionalSelections) {
          if (updated.length >= 20) break;
          const normalized = normalizeSelectionInput(rawSel);
          const matchIdx = updated.findIndex(
            (s) =>
              s.homeTeam.toLowerCase() === normalized.homeTeam.toLowerCase() &&
              s.awayTeam.toLowerCase() === normalized.awayTeam.toLowerCase()
          );
          if (matchIdx >= 0) {
            updated[matchIdx] = normalized;
          } else {
            updated.push(normalized);
          }
        }
        toast.success(
          `Grouped ${updated.length} predictions into your Weekly Long Bet Accumulation Slip!`
        );
        return updated;
      });
    } else {
      toast.success(
        `Grouped ${selections.length} predictions into your Weekly Long Bet Accumulation Slip!`
      );
    }

    setIsOpen(true);
  };

  const removeSelection = (id: string) => {
    hapticService.remove();
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const clearSlip = () => {
    hapticService.clear();
    setSelections([]);
    setIsSafetyCushionActive(false);
    toast.info('Bet slip cleared');
  };

  const isSelected = (idOrMatch: string, selectionOrMarket?: string): boolean => {
    if (!idOrMatch) return false;
    const q = String(idOrMatch).toLowerCase().trim();
    const targetMarket = selectionOrMarket ? String(selectionOrMarket).toLowerCase().trim() : null;

    return selections.some((s) => {
      const idVal = (s.id || '').toLowerCase();
      const matchIdVal = (s.matchId || '').toLowerCase();
      const matchVal = (s.match || `${s.homeTeam} vs ${s.awayTeam}`).toLowerCase();
      const pairDash = `${s.homeTeam}-${s.awayTeam}`.toLowerCase();

      const matchesFixture =
        idVal === q ||
        idVal.startsWith(`${q}-`) ||
        matchIdVal === q ||
        matchVal === q ||
        pairDash === q;

      if (!matchesFixture) return false;
      if (!targetMarket) return true;

      const sMarket = (s.market || '').toLowerCase();
      const sSelection = (s.selection || '').toLowerCase();
      const sCategory = (s.marketCategory || '').toLowerCase();

      return (
        sMarket === targetMarket ||
        sSelection === targetMarket ||
        sCategory === targetMarket ||
        idVal.includes(targetMarket.replace(/[^a-z0-9]/g, '-'))
      );
    });
  };

  const isInSlip = (idOrMatch: string, selectionOrMarket?: string): boolean => {
    return isSelected(idOrMatch, selectionOrMarket);
  };

  const safeStake = Number.isFinite(stake) ? Math.max(0, stake) : 0;

  // Compute cumulative step-by-step odds and returns for every leg in the Weekly Long Bet
  const legProgression = useMemo<LegCumulativeStep[]>(() => {
    let runningOdds = 1;
    return selections.map((sel, index) => {
      const stepOdds = Number.isFinite(Number(sel.odds)) && Number(sel.odds) > 0 ? Number(sel.odds) : 1;
      runningOdds *= stepOdds;
      const roundedCumulativeOdds = Math.round(runningOdds * 100) / 100;
      return {
        selection: sel,
        legNumber: index + 1,
        dayGroup: sel.dayGroup || resolveDayGroup(sel.matchDate),
        stepOdds,
        cumulativeOdds: roundedCumulativeOdds,
        cumulativeReturn: Math.round(safeStake * roundedCumulativeOdds * 100) / 100,
      };
    });
  }, [selections, safeStake]);

  const rawTotalOdds = selections.reduce((acc, s) => {
    const o = Number(s.odds);
    return acc * (Number.isFinite(o) && o > 0 ? o : 1);
  }, 1);

  const totalOdds =
    selections.length > 0 && Number.isFinite(rawTotalOdds)
      ? Math.max(1, Math.round(rawTotalOdds * 100) / 100)
      : 1;

  // Dynamic accumulator bonus (up to +60% for 15+ leg Weekly Long Bets)
  const getBonusMultiplier = (count: number) => {
    if (count >= 15) return 0.60; // 60% Weekly Mega Long Bet bonus
    if (count >= 12) return 0.50; // 50% Weekly Long Bet bonus
    if (count >= 8) return 0.30;  // 30% bonus
    if (count >= 5) return 0.15;  // 15% 5-Game Pack bonus
    if (count >= 3) return 0.05;  // 5% bonus
    return 0;
  };

  const nextBonusTier = useMemo(() => {
    const count = selections.length;
    if (count < 3) return { legsNeeded: 3 - count, nextBonusPct: 5 };
    if (count < 5) return { legsNeeded: 5 - count, nextBonusPct: 15 };
    if (count < 8) return { legsNeeded: 8 - count, nextBonusPct: 30 };
    if (count < 12) return { legsNeeded: 12 - count, nextBonusPct: 50 };
    if (count < 15) return { legsNeeded: 15 - count, nextBonusPct: 60 };
    return null;
  }, [selections.length]);

  const bonusMultiplier = getBonusMultiplier(selections.length);
  const potentialReturn = Math.round(safeStake * totalOdds * 100) / 100;
  const bonusAmount = Math.round(potentialReturn * bonusMultiplier * 100) / 100;
  const boostedReturn = Math.round((potentialReturn + bonusAmount) * 100) / 100;
  const netProfit = Math.max(0, Math.round((boostedReturn - safeStake) * 100) / 100);

  const combinedConfidence =
    selections.length > 0
      ? Math.round(selections.reduce((acc, s) => acc * ((s.confidence || 65) / 100), 1) * 100)
      : 0;

  const generateBookingCode = (bookmaker: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const length = bookmaker.toLowerCase().includes('sporty')
      ? 6
      : bookmaker.toLowerCase().includes('1x')
        ? 7
        : 5;
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${bookmaker.toUpperCase().slice(0, 2)}-${code}`;
  };

  const getShareableSlipUrl = (
    customItems?: BetSelectionInput[],
    bookmaker?: string,
    bookingCode?: string
  ): string => {
    const targetItems = customItems && customItems.length > 0 ? customItems : selections;
    const encoded = encodeSlipToParam(targetItems);
    const params = new URLSearchParams();
    if (encoded) params.set('slip', encoded);
    if (bookmaker) params.set('bookie', bookmaker);
    if (bookingCode) params.set('code', bookingCode);
    const qs = params.toString();
    return qs ? `https://predictpro.guru/?${qs}` : 'https://predictpro.guru';
  };

  return (
    <BetSlipContext.Provider
      value={{
        selections,
        isOpen,
        setIsOpen,
        slipMode,
        setSlipMode,
        isSafetyCushionActive,
        toggleSafetyCushion,
        stake,
        setStake,
        currency,
        setCurrency,
        addSelection,
        addSelections,
        groupIntoWeeklyLongBet,
        removeSelection,
        clearSlip,
        isInSlip,
        isSelected,
        totalOdds,
        bonusMultiplier,
        bonusAmount,
        potentialReturn,
        boostedReturn,
        netProfit,
        combinedConfidence,
        legProgression,
        nextBonusTier,
        generateBookingCode,
        getShareableSlipUrl,
        triggerHaptic: (pattern?: HapticPattern) => hapticService.trigger(pattern),
        isHapticSupported: hapticService.isSupported(),
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
};

const defaultFallbackContext: BetSlipContextType = {
  selections: [],
  isOpen: false,
  setIsOpen: () => {},
  slipMode: 'standard',
  setSlipMode: () => {},
  isSafetyCushionActive: false,
  toggleSafetyCushion: () => {},
  stake: 100,
  setStake: () => {},
  currency: 'KES',
  setCurrency: () => {},
  addSelection: () => {},
  addSelections: () => {},
  groupIntoWeeklyLongBet: () => {},
  removeSelection: () => {},
  clearSlip: () => {},
  isInSlip: () => false,
  isSelected: () => false,
  totalOdds: 1,
  bonusMultiplier: 0,
  bonusAmount: 0,
  potentialReturn: 0,
  boostedReturn: 0,
  netProfit: 0,
  combinedConfidence: 0,
  legProgression: [],
  nextBonusTier: { legsNeeded: 3, nextBonusPct: 5 },
  generateBookingCode: () => '',
  getShareableSlipUrl: () => 'https://predictpro.guru',
  triggerHaptic: () => false,
  isHapticSupported: false,
};

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  return context || defaultFallbackContext;
};
