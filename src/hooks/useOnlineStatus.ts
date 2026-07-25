import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then(status => setIsOnline(status.connected));

      const handler = Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      });

      return () => {
        handler.then(h => h.remove());
      };
    } else {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return isOnline;
}
