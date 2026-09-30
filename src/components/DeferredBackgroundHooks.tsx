import React from 'react';
import { useAutoIndexing } from '@/hooks/useAutoIndexing';
import { useGeminiDailyCron } from '@/hooks/useGeminiDailyCron';
import { useMatchSync } from '@/hooks/useMatchSync';

export const DeferredBackgroundHooks: React.FC = () => {
  useAutoIndexing();
  useGeminiDailyCron();
  useMatchSync();
  return null;
};

export default DeferredBackgroundHooks;
