import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { POPULAR_TIMEZONES, getDeviceTimezone, getTimezoneShortLabel } from '@/services/timezoneService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Clock, Check, MapPin } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const TimezoneSelector: React.FC<Props> = ({ compact = false }) => {
  const { preferences, setTimezone } = useUserPreferences();
  const activeTz = preferences.timezone;
  const currentTzOption =
    POPULAR_TIMEZONES.find((t) => t.value === activeTz) || {
      value: activeTz,
      label: activeTz,
      offset: getTimezoneShortLabel(activeTz),
      region: 'Custom',
      flag: '📍',
    };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
          aria-label={`Timezone: ${currentTzOption.label}. Click to switch timezone.`}
        >
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          {!compact && (
            <span className="hidden lg:inline truncate max-w-[130px]">
              {activeTz === 'auto' ? 'Local Time' : currentTzOption.offset}
            </span>
          )}
          <span className="lg:hidden text-[11px] font-bold">
            {activeTz === 'auto' ? 'Local' : currentTzOption.offset}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto p-1.5">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Match Kickoff Timezone
          </span>
        </DropdownMenuLabel>
        <div className="px-2 py-1 text-[11px] text-muted-foreground">
          Auto-detected: <span className="font-semibold text-foreground">{getDeviceTimezone()}</span>
        </div>
        <DropdownMenuSeparator />
        {POPULAR_TIMEZONES.map((tz) => {
          const isSelected = preferences.timezone === tz.value;
          return (
            <DropdownMenuItem
              key={tz.value}
              onClick={() => setTimezone(tz.value)}
              className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer rounded-md text-xs font-medium ${
                isSelected ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tz.flag}</span>
                <div>
                  <div className="text-xs font-semibold">{tz.label}</div>
                  <div className="text-[10px] text-muted-foreground">{tz.region} · {tz.offset}</div>
                </div>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
