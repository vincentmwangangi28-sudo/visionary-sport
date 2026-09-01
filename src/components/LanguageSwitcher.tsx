import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/services/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<Props> = ({ compact = false }) => {
  const { preferences, setLanguage } = useUserPreferences();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === preferences.language) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold hover:border-primary/50 transition-colors"
          aria-label={`Current language: ${currentLang.name}. Click to change language.`}
        >
          <span className="text-sm">{currentLang.flag}</span>
          {!compact && <span className="hidden md:inline">{currentLang.name}</span>}
          <span className="md:hidden text-[11px] font-bold uppercase">{currentLang.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-primary" /> Select Global Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = preferences.language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between px-2.5 py-2 cursor-pointer rounded-md text-xs font-medium ${
                isSelected ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{lang.flag}</span>
                <div>
                  <div className="text-xs font-semibold">{lang.nativeName}</div>
                  <div className="text-[10px] text-muted-foreground">{lang.region}</div>
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
