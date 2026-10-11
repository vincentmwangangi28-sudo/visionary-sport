import React from 'react';
import { useAutoIndexing } from '@/hooks/useAutoIndexing';
import { useGeminiDailyCron } from '@/hooks/useGeminiDailyCron';
import { useMatchSync } from '@/hooks/useMatchSync';
import { useGlobalTelegramAutomation } from '@/hooks/useTelegramAlerts';
import { useSiteKeepalive } from '@/hooks/useSiteKeepalive';

export const DeferredBackgroundHooks: React.FC = () => {
  useAutoIndexing();
  useGeminiDailyCron();
  useMatchSync();
  useGlobalTelegramAutomation();
  useSiteKeepalive();
  return null;
};

export default DeferredBackgroundHooks;
