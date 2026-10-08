import React from 'react';
import { useAutoIndexing } from '@/hooks/useAutoIndexing';
import { useGeminiDailyCron } from '@/hooks/useGeminiDailyCron';
import { useMatchSync } from '@/hooks/useMatchSync';
import { useGlobalTelegramAutomation } from '@/hooks/useTelegramAlerts';

export const DeferredBackgroundHooks: React.FC = () => {
  useAutoIndexing();
  useGeminiDailyCron();
  useMatchSync();
  useGlobalTelegramAutomation();
  return null;
};

export default DeferredBackgroundHooks;
