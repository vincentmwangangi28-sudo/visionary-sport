import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface BetSelection {
  id: string;
  matchId?: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  market: string;
  odds: number;
  confidence: number;
}

interface BetSlipContextType {
  selections: BetSelection[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stake: number;
  setStake: (stake: number) => void;
  currency: string;
  setCurrency: (cur: string) => void;
  addSelection: (selection: Omit<BetSelection, 'id'>) => void;
  addSelections: (selections: Omit<BetSelection, 'id'>[]) => void;
  removeSelection: (id: string) => void;
  clearSlip: () => void;
  totalOdds: number;
  bonusMultiplier: number;
  potentialReturn: number;
  boostedReturn: number;
  combinedConfidence: number;
  generateBookingCode: (bookmaker: string) => string;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

const STORAGE_KEY = 'predictpro_betslip_v2';

export const BetSlipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selections, setSelections] = useState<BetSelection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState<number>(100);
  const [currency, setCurrency] = useState<string>('KES');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch (e) {
      console.error(e);
    }
  }, [selections]);

  const addSelection = (sel: Omit<BetSelection, 'id'>) => {
    const id = `${sel.homeTeam}-${sel.awayTeam}-${sel.market}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if already in bet slip
    if (selections.some(s => s.id === id)) {
      toast.info(`Already added to bet slip: ${sel.market}`);
      return;
    }

    // Check if conflicting market for same match exists
    const existingMatch = selections.find(s => s.homeTeam === sel.homeTeam && s.awayTeam === sel.awayTeam);
    if (existingMatch) {
      // Replace with new market selection
      setSelections(prev => prev.map(s => s.id === existingMatch.id ? { ...sel, id } : s));
      toast.success(`Updated ${sel.homeTeam} vs ${sel.awayTeam} to ${sel.market}`);
      setIsOpen(true);
      return;
    }

    if (selections.length >= 15) {
      toast.error('Maximum 15 selections per accumulator slip.');
      return;
    }

    setSelections(prev => [...prev, { ...sel, id }]);
    toast.success(`Added ${sel.homeTeam} vs ${sel.awayTeam} (${sel.market} @ ${sel.odds.toFixed(2)})`);
    setIsOpen(true);
  };

  const addSelections = (newSels: Omit<BetSelection, 'id'>[]) => {
    if (!newSels || newSels.length === 0) return;

    setSelections(prev => {
      const updated = [...prev];
      let addedCount = 0;

      for (const sel of newSels) {
        if (updated.length >= 15) break;
        const id = `${sel.homeTeam}-${sel.awayTeam}-${sel.market}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        // If exact selection exists, skip
        if (updated.some(s => s.id === id)) continue;

        // If same match exists, update market
        const matchIdx = updated.findIndex(s => s.homeTeam === sel.homeTeam && s.awayTeam === sel.awayTeam);
        if (matchIdx >= 0) {
          updated[matchIdx] = { ...sel, id };
          addedCount++;
        } else {
          updated.push({ ...sel, id });
          addedCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`Loaded ${addedCount} recommended pick${addedCount > 1 ? 's' : ''} into Bet Slip!`);
      } else {
        toast.info('Selected picks are already in your Bet Slip');
      }

      return updated;
    });

    setIsOpen(true);
  };

  const removeSelection = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const clearSlip = () => {
    setSelections([]);
    toast.info('Bet slip cleared');
  };

  const totalOdds = selections.reduce((acc, s) => acc * (s.odds || 1), 1);

  // Dynamic accumulator bonus
  const getBonusMultiplier = (count: number) => {
    if (count >= 12) return 0.50; // 50% bonus
    if (count >= 8) return 0.30;  // 30% bonus
    if (count >= 5) return 0.15;  // 15% bonus
    if (count >= 3) return 0.05;  // 5% bonus
    return 0;
  };

  const bonusMultiplier = getBonusMultiplier(selections.length);
  const potentialReturn = (stake || 0) * totalOdds;
  const boostedReturn = potentialReturn * (1 + bonusMultiplier);

  const combinedConfidence = selections.length > 0
    ? Math.round(selections.reduce((acc, s) => acc * ((s.confidence || 65) / 100), 1) * 100)
    : 0;

  const generateBookingCode = (bookmaker: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const length = bookmaker.toLowerCase().includes('sporty') ? 6 : bookmaker.toLowerCase().includes('1x') ? 7 : 5;
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${bookmaker.toUpperCase().slice(0, 2)}-${code}`;
  };

  return (
    <BetSlipContext.Provider value={{
      selections,
      isOpen,
      setIsOpen,
      stake,
      setStake,
      currency,
      setCurrency,
      addSelection,
      addSelections,
      removeSelection,
      clearSlip,
      totalOdds,
      bonusMultiplier,
      potentialReturn,
      boostedReturn,
      combinedConfidence,
      generateBookingCode,
    }}>
      {children}
    </BetSlipContext.Provider>
  );
};

const defaultFallbackContext: BetSlipContextType = {
  selections: [],
  isOpen: false,
  setIsOpen: () => {},
  stake: 100,
  setStake: () => {},
  currency: 'KES',
  setCurrency: () => {},
  addSelection: () => {},
  addSelections: () => {},
  removeSelection: () => {},
  clearSlip: () => {},
  totalOdds: 1,
  bonusMultiplier: 0,
  potentialReturn: 0,
  boostedReturn: 0,
  combinedConfidence: 0,
  generateBookingCode: () => '',
};

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  return context || defaultFallbackContext;
};
