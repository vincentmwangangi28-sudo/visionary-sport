import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: number | null = null;
    const handleScroll = () => {
      if (timeoutId !== null) return;
      timeoutId = window.setTimeout(() => {
        setVisible(window.scrollY > 420);
        timeoutId = null;
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed z-30 transition-all duration-300 animate-in fade-in zoom-in-95',
        // On mobile, sit on the left (bottom-20 left-4) so it never collides with floating bet slips or chat FABs; on desktop sit at bottom-8 right-8
        'bottom-20 left-4 md:left-auto md:bottom-8 md:right-8'
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          'h-10 w-10 md:h-11 md:w-11 rounded-full shadow-lg border border-border/80',
          'bg-background/90 hover:bg-background text-foreground/80 hover:text-primary backdrop-blur-md',
          'hover:scale-110 active:scale-95 transition-all duration-200'
        )}
        title="Scroll back to top"
        aria-label="Scroll to top of page"
      >
        <ArrowUp className="h-4 w-4 md:h-5 md:w-5" />
      </Button>
    </div>
  );
};
