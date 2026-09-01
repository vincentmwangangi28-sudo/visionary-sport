import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ODDS_FORMATS, SupportedOddsFormat } from '@/services/oddsConverter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Percent, Check } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const OddsFormatSelector: React.FC<Props> = ({ compact = false }) => {
  const { preferences, setOddsFormat } = useUserPreferences();
  const currentFormat = ODDS_FORMATS.find((f) => f.id === preferences.oddsFormat) || ODDS_FORMATS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
          aria-label={`Odds format: ${currentFormat.name}. Click to change.`}
        >
          <Percent className="h-3.5 w-3.5 text-primary shrink-0" />
          {!compact && <span className="hidden md:inline capitalize">{preferences.oddsFormat}</span>}
          <span className="md:hidden text-[11px] font-bold uppercase">{preferences.oddsFormat.slice(0, 3)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
          <Percent className="h-3.5 w-3.5 text-primary" /> Select Odds Format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ODDS_FORMATS.map((fmt) => {
          const isSelected = preferences.oddsFormat === fmt.id;
          return (
            <DropdownMenuItem
              key={fmt.id}
              onClick={() => setOddsFormat(fmt.id as SupportedOddsFormat)}
              className={`flex items-center justify-between px-2.5 py-2 cursor-pointer rounded-md text-xs font-medium ${
                isSelected ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <div>
                <div className="text-xs font-semibold">{fmt.name}</div>
                <div className="text-[10px] text-muted-foreground">Ex: {fmt.example} ({fmt.region})</div>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
