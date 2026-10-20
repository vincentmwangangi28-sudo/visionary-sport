import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Ticket,
  Menu,
  Trophy,
  Calendar,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useAdmin } from '@/hooks/useAdmin';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UnifiedSearchTrigger } from '@/components/UnifiedSearchTrigger';

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { selections, setIsOpen: setSlipOpen } = useBetSlip();
  const { isAdmin } = useAdmin();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Matches',
      icon: Calendar,
      isActive: pathname === '/',
    },
    {
      to: '/live',
      label: 'Live',
      icon: Activity,
      isActive: pathname === '/live',
      hasBeacon: true,
    },
    {
      to: '/standings',
      label: 'Tables',
      icon: Trophy,
      isActive: pathname === '/standings',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden touch-manipulation select-none"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-14 items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleHaptic}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
                item.isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.hasBeacon && (
                  <span className="absolute -top-0.5 -right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Match Slip Button */}
        <button
          type="button"
          onClick={() => {
            handleHaptic();
            setSlipOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[48px] ${
            selections.length > 0 || pathname === '/accumulator'
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Open Match Slip"
          aria-label={`Match Slip: ${selections.length} picks`}
        >
          <div className="relative">
            <Ticket className="h-4 w-4" />
            {selections.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 h-3.5 min-w-[0.875rem] px-1 bg-foreground text-background font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                {selections.length}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none">Slip</span>
        </button>

        {/* More Sheet Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={handleHaptic}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-[48px]"
              aria-label="Open More Menu"
            >
              <Menu className="h-4 w-4" />
              <span className="text-[10px] leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl max-h-[82vh] overflow-y-auto px-4 pb-8 pt-4">
            <SheetHeader className="text-left pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-sm font-bold">Leagues &amp; Tools</SheetTitle>
                <UnifiedSearchTrigger variant="icon" />
              </div>
            </SheetHeader>

            <div className="py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Competitions</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { to: '/premier-league-predictions', label: 'Premier League' },
                    { to: '/champions-league-predictions', label: 'Champions League' },
                    { to: '/la-liga-predictions', label: 'LaLiga' },
                    { to: '/serie-a-predictions', label: 'Serie A' },
                    { to: '/bundesliga-predictions', label: 'Bundesliga' },
                    { to: '/kpl-predictions', label: 'FKF Premier League' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSheetOpen(false)}
                      className="px-3 py-2 rounded-md border border-border bg-muted/30 font-medium text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Markets &amp; Stats</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { to: '/sure-win-predictions', label: 'High Probability' },
                    { to: '/over-under-predictions', label: 'Over / Under 2.5' },
                    { to: '/btts', label: 'Both Teams to Score' },
                    { to: '/correct-score', label: 'Correct Score' },
                    { to: '/screener', label: 'Match Screener' },
                    { to: '/archive', label: 'Results Archive' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSheetOpen(false)}
                      className="px-3 py-2 rounded-md border border-border bg-muted/30 font-medium text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-border">
                  <Link
                    to="/admin"
                    onClick={() => setSheetOpen(false)}
                    className="block px-3 py-2 rounded-md border border-border text-xs font-semibold text-center"
                  >
                    Admin Console
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
