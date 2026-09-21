import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Activity, 
  Sparkles, 
  Ticket, 
  Menu, 
  TrendingUp, 
  TrendingDown,
  SlidersHorizontal,
  Globe,
  Trophy,
  CheckCircle2,
  Settings,
  Pin,
  ShieldCheck,
  Newspaper
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useAdmin } from '@/hooks/useAdmin';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UnifiedSearchTrigger } from '@/components/UnifiedSearchTrigger';
import { PWAInstallButton } from '@/components/PWAInstallButton';

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { selections, setIsOpen: setSlipOpen } = useBetSlip();
  const { isAdmin } = useAdmin();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Predict',
      icon: Zap,
      isActive: pathname === '/',
    },
    {
      to: '/recommendations',
      label: 'AI Picks',
      icon: Sparkles,
      isActive: pathname === '/recommendations',
    },
    {
      to: '/live',
      label: 'Live',
      icon: Activity,
      isActive: pathname === '/live',
      hasBeacon: true,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg md:hidden touch-manipulation select-none"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-15 items-stretch">
        {/* Core items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleHaptic}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-150 min-h-[48px] active:scale-90 ${
                item.isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform ${item.isActive ? 'scale-110 fill-primary/20' : ''}`} />
                {item.hasBeacon && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Dynamic Acca Slip Button */}
        <button
          type="button"
          onClick={() => {
            handleHaptic();
            setSlipOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-150 min-h-[48px] active:scale-90 ${
            selections.length > 0 || pathname === '/accumulator'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Open Accumulator Bet Slip"
          aria-label={`Bet Slip: ${selections.length} picks`}
        >
          {(pathname === '/accumulator' || selections.length > 0) && (
            <span className="absolute top-0 w-8 h-0.5 rounded-full bg-amber-500" />
          )}
          <div className="relative">
            <Ticket className={`h-5 w-5 transition-transform ${selections.length > 0 ? 'text-amber-500 scale-105' : ''}`} />
            {selections.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 h-4 min-w-[1rem] px-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50">
                {selections.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none">
            {selections.length > 0 ? `${selections.length} Picks` : 'Bet Slip'}
          </span>
        </button>

        {/* Explore / Quick Drawer Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={handleHaptic}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-150 min-h-[48px] active:scale-90 ${
                sheetOpen ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="More Categories & Tools"
              aria-label="Open Navigation Directory"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] tracking-tight leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8 pt-4 overflow-y-auto">
            <SheetHeader className="text-left pb-3 border-b">
              <SheetTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">PP</div>
                  PredictPro Directory
                </span>
                <PWAInstallButton size="sm" variant="outline" className="text-xs" />
              </SheetTitle>
            </SheetHeader>

            {/* Instant Search Bar */}
            <div className="mt-3">
              <UnifiedSearchTrigger
                variant="full"
                placeholder="Search teams, leagues, predictions..."
                className="w-full max-w-none"
              />
            </div>

            {/* Personal Hub Quick Action */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <Link
                to="/dashboard"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-primary/5 border-primary/20 text-xs font-bold text-foreground hover:bg-primary/10 transition-colors"
              >
                <Pin className="h-4 w-4 text-primary fill-primary/30 shrink-0" />
                <span className="truncate">My Dashboard</span>
              </Link>
              <Link
                to="/preferences"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/40 text-xs font-bold text-foreground hover:bg-muted/70 transition-colors"
              >
                <Settings className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Preferences</span>
              </Link>
            </div>

            {/* Quick Links Grid */}
            <div className="space-y-4 text-sm mt-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Smart Markets & Radar</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to="/value-bets"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Value Bets (+EV)</span>
                  </Link>
                  <Link
                    to="/dropping-odds"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <TrendingDown className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>Dropping Odds</span>
                  </Link>
                  <Link
                    to="/screener"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Match Screener</span>
                  </Link>
                  <Link
                    to="/tournaments"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <Globe className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Tournaments</span>
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Analysis & Results</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to="/track-record"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Track Record</span>
                  </Link>
                  <Link
                    to="/archive"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Results Archive</span>
                  </Link>
                  <Link
                    to="/standings"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>League Standings</span>
                  </Link>
                  <Link
                    to="/news"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 text-xs font-medium"
                  >
                    <Newspaper className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>News &amp; Tips</span>
                  </Link>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t">
                  <Link
                    to="/admin"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Admin Operations Hub
                    </span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

