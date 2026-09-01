import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { SupportedCurrencyCode } from '@/services/currencyService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Coins, ChevronDown } from 'lucide-react';

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
  variant?: 'outline' | 'ghost' | 'secondary' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  compact = false,
  className = '',
  variant = 'outline',
  size = 'sm',
}) => {
  const { currency, currencyConfig, setCurrency, allCurrencies } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`h-8 gap-1.5 px-2.5 text-xs font-semibold ${className}`}
          aria-label={`Select currency, current: ${currencyConfig.name}`}
        >
          <span className="text-base leading-none">{currencyConfig.flag}</span>
          <span>{currencyConfig.code} ({currencyConfig.symbol})</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[320px] overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" /> Select Currency
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">16 Currencies</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allCurrencies.map((c) => {
          const isSelected = currency === c.code;
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => setCurrency(c.code as SupportedCurrencyCode)}
              className={`flex items-center justify-between text-xs py-2 cursor-pointer ${
                isSelected ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{c.flag}</span>
                <div>
                  <span className="font-semibold">{c.code}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">({c.symbol})</span>
                  <p className="text-[10px] text-muted-foreground font-normal leading-tight">{c.name}</p>
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
