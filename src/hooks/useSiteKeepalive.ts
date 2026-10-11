import { useState, useEffect, useCallback } from 'react';
import {
  getKeepaliveTelemetry,
  triggerKeepalivePulse,
  isClientSentinelEnabled,
  setClientSentinelEnabled,
  startClientKeepaliveSentinel,
  KEEPALIVE_EVENT,
  KeepaliveTelemetry,
} from '@/services/siteKeepaliveService';

export function useSiteKeepalive() {
  const [telemetry, setTelemetry] = useState<KeepaliveTelemetry>(getKeepaliveTelemetry());
  const [isEnabled, setIsEnabled] = useState<boolean>(isClientSentinelEnabled());
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  useEffect(() => {
    startClientKeepaliveSentinel();

    const handlePulse = (event: any) => {
      if (event.detail) {
        setTelemetry(event.detail);
      } else {
        setTelemetry(getKeepaliveTelemetry());
      }
    };

    window.addEventListener(KEEPALIVE_EVENT, handlePulse);
    return () => {
      window.removeEventListener(KEEPALIVE_EVENT, handlePulse);
    };
  }, []);

  const triggerNow = useCallback(async (source = 'manual_dashboard_click') => {
    setIsPulsing(true);
    try {
      const res = await triggerKeepalivePulse(source);
      setTelemetry(getKeepaliveTelemetry());
      return res;
    } finally {
      setIsPulsing(false);
    }
  }, []);

  const toggleEnabled = useCallback((nextEnabled: boolean) => {
    setClientSentinelEnabled(nextEnabled);
    setIsEnabled(nextEnabled);
  }, []);

  return {
    telemetry,
    isEnabled,
    isPulsing,
    triggerNow,
    toggleEnabled,
  };
}
