import React, { useState, useEffect } from 'react';
import {
  ArrowUp,
  ChevronUp,
  ChevronDown,
  Compass,
  Layers,
  Zap,
  Trophy,
  Newspaper,
  Archive,
  X,
  LayoutGrid,
  List,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticService } from '@/services/hapticService';

interface SectionTarget {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_SECTIONS: SectionTarget[] = [
  { id: 'section-predictions', label: 'Predictions Feed', icon: Trophy },
  { id: 'section-live', label: 'Live & In-Play', icon: Zap },
  { id: 'section-slips', label: 'Smart Accas', icon: Layers },
  { id: 'section-news', label: 'News & Lineups', icon: Newspaper },
  { id: 'section-archive', label: 'Results Archive', icon: Archive },
];

export const ScrollNavigator: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('section-predictions');
  const [currentDensity, setCurrentDensity] = useState<'card' | 'compact' | 'condensed'>(() => {
    try {
      return (localStorage.getItem('predictpro_view_mode') as 'card' | 'compact' | 'condensed') || 'card';
    } catch {
      return 'card';
    }
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;

          setScrollProgress(progress);
          setVisible(scrollTop > 240);

          // Find current active section
          for (const sec of DEFAULT_SECTIONS) {
            const el = document.getElementById(sec.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 200 && rect.bottom >= 200) {
                setActiveSectionId(sec.id);
                break;
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    hapticService.selection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    hapticService.selection();
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const jumpToNextSection = () => {
    hapticService.selection();
    const currentIndex = DEFAULT_SECTIONS.findIndex((s) => s.id === activeSectionId);
    const nextIndex = (currentIndex + 1) % DEFAULT_SECTIONS.length;
    scrollToSection(DEFAULT_SECTIONS[nextIndex].id);
  };

  const changeDensity = (mode: 'card' | 'compact' | 'condensed') => {
    hapticService.selection();
    setCurrentDensity(mode);
    try {
      localStorage.setItem('predictpro_view_mode', mode);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('predictpro:set-density', { detail: mode }));
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Speed scroll navigation dock"
      className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2"
    >
      {/* Quick Jump & View Density Overlay Menu */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-label="Speed navigator and density menu"
          className="bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-3 w-64 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border/50 text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <Compass className="h-3.5 w-3.5" /> Speed Navigator
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Density Switcher to stop long scroll fatigue */}
          <div className="bg-muted/50 p-2 rounded-xl border border-border/50 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Reduce Page Scrolling (Density)
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => changeDensity('card')}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                  currentDensity === 'card'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => changeDensity('compact')}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                  currentDensity === 'compact'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                }`}
              >
                <List className="h-3 w-3" />
                <span>Compact</span>
              </button>
              <button
                type="button"
                onClick={() => changeDensity('condensed')}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                  currentDensity === 'condensed'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                }`}
              >
                <AlignJustify className="h-3 w-3" />
                <span>1-Line</span>
              </button>
            </div>
          </div>

          {/* Direct Section Hoppers */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              Jump to Module
            </span>
            {DEFAULT_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{sec.label}</span>
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick Teleport to Top */}
          <div className="pt-1.5 border-t border-border/50">
            <button
              onClick={scrollToTop}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Scroll to Top</span>
              </span>
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">0%</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Speed Dock */}
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border border-border/80 shadow-xl rounded-full p-1 transition-all hover:border-primary/50">
        {/* Quick Menu Button with Progress Badge */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-8 px-2.5 rounded-full text-xs font-bold gap-1.5 text-foreground hover:bg-muted/70"
          title="Open Speed Navigator & Density Menu"
          aria-label="Open speed navigator"
        >
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
            {scrollProgress}%
          </span>
        </Button>

        {/* Quick Hopper to Next Section */}
        <Button
          variant="ghost"
          size="icon"
          onClick={jumpToNextSection}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/70"
          title="Jump down to next section"
          aria-label="Jump down to next section"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border/80" />

        {/* Back To Top Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToTop}
          className="h-8 w-8 rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Scroll back to top of page"
          aria-label="Scroll back to top"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
};
