import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Zap, ZapOff } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  compact?: boolean;
}

export const DataSaverToggle: React.FC<Props> = ({ compact = false }) => {
  const { preferences, toggleDataSaver } = useUserPreferences();
  const isActive = preferences.dataSaverMode;

  const handleToggle = () => {
    toggleDataSaver();
    if (!isActive) {
      toast.success('Data Saver Activated: Live background polling slowed down to minimize mobile cellular data usage.');
    } else {
      toast.info('Data Saver Deactivated: High-frequency live updates restored.');
    }
  };

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      className={`h-8 gap-1.5 px-2.5 text-xs font-semibold transition-all ${
        isActive ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm' : ''
      }`}
      aria-label={`Data Saver mode is currently ${isActive ? 'ON' : 'OFF'}. Click to toggle.`}
      title={isActive ? 'Data Saver Active (Low bandwidth mode)' : 'Enable Low-Bandwidth Data Saver'}
    >
      {isActive ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
      {!compact && <span className="hidden xl:inline">{isActive ? 'Data Saver ON' : 'Data Saver'}</span>}
    </Button>
  );
};
