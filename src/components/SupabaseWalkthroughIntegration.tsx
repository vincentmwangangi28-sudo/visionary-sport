import React from 'react';
import { useSupabaseWalkthrough } from '@/hooks/useSupabaseWalkthrough';
import { SupabaseWalkthroughModal } from '@/components/SupabaseWalkthroughModal';
import { SupabaseFallbackBanner } from '@/components/SupabaseFallbackBanner';
import { useAdmin } from '@/hooks/useAdmin';

export const SupabaseWalkthroughIntegration: React.FC = () => {
  const { isAdmin } = useAdmin();
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

  // Strictly restricted to designated administrator Vincent Mwangangi
  if (!isAdmin) return null;

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
