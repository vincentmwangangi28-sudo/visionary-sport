import React from 'react';
import { Database, KeyRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupabaseFallbackBannerProps {
  isVisible: boolean;
  onOpenWalkthrough: () => void;
  onDismiss: () => void;
}

export const SupabaseFallbackBanner: React.FC<SupabaseFallbackBannerProps> = ({
  isVisible,
  onOpenWalkthrough,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <aside
      aria-label="Supabase environment configuration notice"
      className="bg-card/95 border-b border-border/70 backdrop-blur-sm px-4 py-2.5 text-xs text-muted-foreground transition-all"
    >
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-foreground mr-1.5">Supabase Environment Setup:</span>
            <span className="hidden md:inline">
              Missing custom project keys in build. Running on fallback mode.
            </span>
            <span className="md:hidden">
              Running on fallback credentials.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenWalkthrough}
            className="h-7 px-2.5 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <KeyRound className="w-3 h-3" />
            <span>Inject Keys for Session</span>
          </Button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss Supabase configuration notice for this session"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
