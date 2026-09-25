import React from 'react';
import { useSupabaseWalkthrough } from '@/hooks/useSupabaseWalkthrough';
import { SupabaseWalkthroughModal } from '@/components/SupabaseWalkthroughModal';
import { SupabaseFallbackBanner } from '@/components/SupabaseFallbackBanner';

export const SupabaseWalkthroughIntegration: React.FC = () => {
  const {
    isOpen,
    closeWalkthrough,
    openWalkthrough,
    status,
    inject,
    reset,
    testConnection,
    shouldShowFallbackNotice,
    dismissNotice,
  } = useSupabaseWalkthrough();

  return (
    <>
      <SupabaseFallbackBanner
        isVisible={shouldShowFallbackNotice}
        onOpenWalkthrough={openWalkthrough}
        onDismiss={dismissNotice}
      />
      <SupabaseWalkthroughModal
        isOpen={isOpen}
        onClose={closeWalkthrough}
        status={status}
        onInject={inject}
        onReset={reset}
        onTestConnection={testConnection}
      />
    </>
  );
};
