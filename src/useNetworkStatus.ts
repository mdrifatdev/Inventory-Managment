import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './offlineStore';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Read quantity of pending sync items from indexDB in a reactive way using dexie-react-hooks
  const pendingCount = useLiveQuery(() => db.pendingSyncs.count()) || 0;

  const currentPendingCount = useLiveQuery(
    async () => {
      try {
        return await db.pendingSyncs.count();
      } catch (e) {
        return 0;
      }
    }
  ) ?? 0;

  // Function to actively check ping
  const checkConnectivity = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    
    setIsChecking(true);
    try {
      // Try to ping a tiny image, favicon or lightweight text to ensure we are actually online
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-store'
      });
      setIsOnline(true);
      setIsChecking(false);
      return true;
    } catch (e) {
      // Falback if fetch fails (e.g., DNS, Captive portals, CORS/network failures)
      setIsOnline(false);
      setIsChecking(false);
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnectivity();

    // Check periodically every 15 seconds to auto-recover if connection is flaky
    const interval = setInterval(checkConnectivity, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isChecking,
    pendingCount: currentPendingCount,
    checkConnectivity
  };
}
