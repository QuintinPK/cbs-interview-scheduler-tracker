
import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus } from '@/lib/offlineDB';

export const useSyncStatusMonitor = () => {
  const [status, setStatus] = useState<any>({
    sessionsTotal: 0,
    sessionsUnsynced: 0,
    sessionsInProgress: 0,
    interviewsTotal: 0,
    interviewsUnsynced: 0,
    interviewsInProgress: 0,
    lastSync: null,
    currentLock: null
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const currentStatus = await getSyncStatus();
      setStatus(currentStatus);
      
      // Auto-detect if sync is in progress
      if (currentStatus.currentLock?.isLocked === 1) {
        setIsSyncing(true);
      } else if (isSyncing) {
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, [isSyncing]);
  
  useEffect(() => {
    refreshStatus();
    
    const intervalId = setInterval(refreshStatus, 5000);
    return () => clearInterval(intervalId);
  }, [refreshStatus]);

  // Calculate derived values
  const totalUnsynced = status.sessionsUnsynced + status.interviewsUnsynced;
  const totalItems = status.sessionsTotal + status.interviewsTotal;
  const syncProgress = totalItems ? Math.round(((totalItems - totalUnsynced) / totalItems) * 100) : 100;

  return {
    status,
    isSyncing,
    setIsSyncing,
    totalUnsynced,
    totalItems,
    syncProgress,
    refreshStatus
  };
};
