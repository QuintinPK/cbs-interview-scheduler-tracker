
import { useState, useEffect, useCallback } from 'react';
import { getSyncManager } from '@/lib/sync';
import { SyncStatusSummary } from '@/lib/sync/syncManager';
import { isOnline } from '@/lib/offlineDB';

export interface SyncState extends SyncStatusSummary {
  retrySync: () => Promise<boolean>;
  resetFailedOperations: () => Promise<number>;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusSummary>({
    isOnline: isOnline(),
    pendingCount: 0,
    failedCount: 0,
    errorCount: 0,
    lastSyncAttempt: null,
    syncInProgress: false,
    syncLockId: null
  });
  
  // Update status initially and periodically
  useEffect(() => {
    const updateStatus = async () => {
      const syncManager = getSyncManager();
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    };
    
    // Update immediately
    updateStatus();
    
    // Subscribe to sync updates
    const syncManager = getSyncManager();
    const unsubscribe = syncManager.subscribe(update => {
      // When we get an update, refresh the full status
      updateStatus();
    });
    
    // Also update periodically
    const intervalId = setInterval(updateStatus, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);
  
  // Handle online/offline events
  useEffect(() => {
    const handleOnlineStatus = () => {
      setSyncStatus(prev => ({
        ...prev,
        isOnline: isOnline()
      }));
      
      // If we just came online, try to sync
      if (isOnline()) {
        const syncManager = getSyncManager();
        syncManager.attemptSync();
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  // Retry sync manually
  const retrySync = useCallback(async () => {
    if (!isOnline()) return false;
    const syncManager = getSyncManager();
    return await syncManager.attemptSync(true);
  }, []);
  
  // Reset failed operations
  const resetFailedOperations = useCallback(async () => {
    const syncManager = getSyncManager();
    return await syncManager.resetFailedOperations();
  }, []);
  
  return {
    ...syncStatus,
    retrySync,
    resetFailedOperations
  };
};
