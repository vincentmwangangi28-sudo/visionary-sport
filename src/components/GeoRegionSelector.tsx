import { useState, useRef, useEffect } from 'react';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Check, Globe, ChevronDown, RotateCcw } from 'lucide-react';

interface GeoRegionSelectorProps {
  variant?: 'pill' | 'compact' | 'full';
  showPrioritizedCount?: number;
  className?: string;
}

export function GeoRegionSelector({ variant = 'pill', className = '' }: GeoRegionSelectorProps) {
  const { region, regionId, isAutoDetected, setRegion, allRegions } = useGeoRegion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (variant === 'compact') {
    return (
      <div ref={containerRef} className="relative inline-block">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`h-10 min-h-[40px] px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
          title={`Current Region: ${region.name}`}
        >
          <span aria-hidden="true">{region.flag}</span>
          <span className="truncate max-w-[90px]">{region.shortLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
        </Button>

        {open && (
          <div
            role="menu"
            aria-label="Regional Football Priority"
            className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-popover text-popover-foreground p-2 shadow-xl"
          >
            <div className="px-2 py-1.5 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Regional Football Priority
              </span>
              {isAutoDetected && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-primary/40 text-primary">
                  Auto-Detected
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground px-2 py-1 leading-relaxed">
              Prioritizes domestic and continental football fixtures on Live Scores &amp; Predictions.
            </p>
            <div className="my-1 h-px bg-border" />

            <div className="max-h-60 overflow-y-auto space-y-1 py-1">
              {allRegions.map((r) => {
                const isSelected = regionId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setRegion(r.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base" aria-hidden="true">{r.flag}</span>
                      <div className="truncate">
                        <div className="font-semibold text-foreground">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{r.countries.slice(0, 3).join(', ')}...</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setRegion('auto');
                setOpen(false);
              }}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset to Auto-Detect Timezone
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative flex items-center justify-between gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 p-2.5 sm:p-3 rounded-xl ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0 border border-primary/20" aria-hidden="true">
          {region.flag}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground truncate">
              {region.name} Football Priority
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/30 text-primary font-medium">
              {isAutoDetected ? '📍 Auto-Detected' : '⚙️ Custom'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
            {region.description}
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-10 min-h-[40px] px-3 text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 shrink-0"
      >
        <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>Switch Region</span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Select Football Region"
          className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-xl border border-border bg-popover text-popover-foreground p-2 shadow-xl"
        >
          <div className="px-2 py-1.5 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Select Football Region
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">Re-sorts league tables</span>
          </div>
          <div className="my-1 h-px bg-border" />

          <div className="max-h-72 overflow-y-auto space-y-1 py-1">
            {allRegions.map((r) => {
              const isSelected = regionId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setRegion(r.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left flex items-start justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none mt-0.5" aria-hidden="true">{r.flag}</span>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        {r.name}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {r.topLeagues.slice(0, 3).map((l) => l.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setRegion('auto');
              setOpen(false);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md cursor-pointer flex items-center gap-2 py-2 justify-center"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Auto-detect based on local timezone</span>
          </button>
        </div>
      )}
    </div>
  );
}
