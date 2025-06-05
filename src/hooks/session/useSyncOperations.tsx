
import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  isOnline, 
  syncOfflineSessions,
  acquireSyncLock,
  releaseSyncLock,
  logSync,
  getSyncStatus
} from '@/lib/offlineDB';
import { requestSync } from '@/registerSW';

interface UseSyncOperationsProps {
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  refreshStatus: () => Promise<void>;
}

export const useSyncOperations = ({ 
  isSyncing, 
  setIsSyncing, 
  refreshStatus 
}: UseSyncOperationsProps) => {
  
  const handleManualSync = useCallback(async () => {
    if (!isOnline()) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    if (isSyncing) {
      toast.warning('Sync already in progress');
      return;
    }
    
    try {
      setIsSyncing(true);
      
      const syncId = `manual-ui-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Try to acquire sync lock
      const lockAcquired = await acquireSyncLock(syncId);
      
      if (!lockAcquired) {
        toast.warning('Sync already in progress');
        setIsSyncing(false);
        return;
      }
      
      // Log sync start
      await logSync('ManualSync', 'Started', 'success', 'Manual sync initiated from UI');
      
      toast.success('Synchronization started');
      
      try {
        // Use Service Worker sync if available
        const swSyncId = requestSync();
        
        if (!swSyncId) {
          // Fall back to direct sync
          await syncOfflineSessions();
        }
        
        // Wait for sync to complete (poll status)
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max wait time
        
        const checkSyncComplete = async () => {
          attempts++;
          const currentStatus = await getSyncStatus();
          
          if (currentStatus.sessionsUnsynced === 0 && currentStatus.interviewsUnsynced === 0) {
            // Sync complete
            toast.success('Synchronization completed successfully');
            await logSync('ManualSync', 'Completed', 'success', 'Manual sync completed');
            setIsSyncing(false);
            await releaseSyncLock(syncId);
            await refreshStatus();
            return;
          }
          
          if (attempts >= maxAttempts) {
            // Timeout
            toast.info('Sync is taking longer than expected and will continue in the background');
            setIsSyncing(false);
            return;
          }
          
          // Check again after delay
          setTimeout(checkSyncComplete, 2000);
        };
        
        // Start checking for completion
        setTimeout(checkSyncComplete, 3000);
        
      } catch (error) {
        console.error('Error during manual sync:', error);
        toast.error('Sync failed. Please try again later.');
        await logSync('ManualSync', 'Error', 'error', `Manual sync error: ${error}`);
        setIsSyncing(false);
        await releaseSyncLock(syncId);
      }
    } catch (error) {
      console.error('Error initiating manual sync:', error);
      toast.error('Could not start synchronization');
      setIsSyncing(false);
    }
  }, [isSyncing, setIsSyncing, refreshStatus]);

  return {
    handleManualSync
  };
};
