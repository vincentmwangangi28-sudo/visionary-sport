import { useState } from 'react';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { GeographicRegionId } from '@/services/geoRegionService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, Sparkles, Check, Globe, ChevronDown, RotateCcw } from 'lucide-react';

interface GeoRegionSelectorProps {
  variant?: 'pill' | 'compact' | 'full';
  showPrioritizedCount?: number;
  className?: string;
}

export function GeoRegionSelector({ variant = 'pill', className = '' }: GeoRegionSelectorProps) {
  const { region, regionId, isAutoDetected, setRegion, allRegions } = useGeoRegion();
  const [open, setOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
            title={`Current Region: ${region.name}`}
            aria-label={`Current Region: ${region.name}. Click to change.`}
          >
            <span>{region.flag}</span>
            <span className="truncate max-w-[90px]">{region.shortLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2">
          <DropdownMenuLabel className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Regional Football Priority
            </span>
            {isAutoDetected && (
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-primary/40 text-primary">
                Auto-Detected
              </Badge>
            )}
          </DropdownMenuLabel>
          <p className="text-[11px] text-muted-foreground px-2 py-1 leading-relaxed">
            Prioritizes domestic and continental football fixtures on Live Scores & Predictions.
          </p>
          <DropdownMenuSeparator />

          <div className="max-h-60 overflow-y-auto space-y-1 py-1">
            {allRegions.map((r) => {
              const isSelected = regionId === r.id;
              return (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer ${
                    isSelected ? 'bg-primary/10 font-bold text-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{r.flag}</span>
                    <div className="truncate">
                      <div className="font-semibold text-foreground">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{r.countries.slice(0, 3).join(', ')}...</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRegion('auto')}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 py-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Auto-Detect Timezone
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 p-2.5 sm:p-3 rounded-xl ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0 border border-primary/20">
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

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 shrink-0"
            aria-label="Change geographic football region"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>Switch Region</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-2">
          <DropdownMenuLabel className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Select Football Region
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">Re-sorts league tables</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="max-h-72 overflow-y-auto space-y-1 py-1">
            {allRegions.map((r) => {
              const isSelected = regionId === r.id;
              return (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`flex items-start justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer ${
                    isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none mt-0.5">{r.flag}</span>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        {r.name}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {r.topLeagues.slice(0, 3).map((l) => l.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRegion('auto')}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2 py-2 justify-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Auto-detect based on local timezone</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
