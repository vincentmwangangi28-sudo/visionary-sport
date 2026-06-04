import { Link, useLocation } from 'react-router-dom';
import { Zap, Activity, Newspaper, Trophy, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navbar } from './Navbar';

const NAV = [
  { to: '/',           label: 'Predict', icon: Zap },
  { to: '/live',       label: 'Live',    icon: Activity },
  { to: '/news',       label: 'News',    icon: Newspaper },
  { to: '/best-bets',  label: 'Best',    icon: Trophy },
];

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${pathname === to ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className={`h-5 w-5 ${pathname === to ? 'fill-primary/10' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
        <Link to="/accumulator" className={`flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${pathname === '/accumulator' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </Link>
      </div>
    </nav>
  );
};
