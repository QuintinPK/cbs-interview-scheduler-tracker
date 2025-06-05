
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  isOnline, 
  syncOfflineSessions, 
  getUnsyncedSessionsCount,
  getUnsyncedInterviewsCount,
  acquireSyncLock,
  releaseSyncLock,
  getSyncStatus
} from "@/lib/offlineDB";

export const useSyncManagement = () => {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState({
    isOffline: !isOnline(),
    unsyncedSessions: 0,
    unsyncedInterviews: 0,
    lastSyncAttempt: null as string | null,
    isSyncInProgress: false
  });

  const [isOffline, setIsOffline] = useState(!isOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [unsyncedInterviews, setUnsyncedInterviews] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const lastSyncAttempt = useRef(0);
  const syncDebounceTime = 5000;

  const debouncedSync = useCallback(async () => {
    const now = Date.now();
    if (now - lastSyncAttempt.current < syncDebounceTime) {
      console.log("Sync attempt too soon after last sync, debouncing...");
      return;
    }

    lastSyncAttempt.current = now;
    const syncId = `manual-${now}-${Math.random().toString(36).substring(2, 10)}`;

    try {
      setIsSyncing(true);
      const lockAcquired = await acquireSyncLock(syncId);
      
      if (!lockAcquired) {
        console.log("Could not acquire sync lock, another sync may be in progress");
        return;
      }
      
      console.log("Starting manual sync with ID:", syncId);
      
      const success = await syncOfflineSessions();
      
      if (success) {
        const newSessionCount = await getUnsyncedSessionsCount();
        const newInterviewCount = await getUnsyncedInterviewsCount();
        setUnsyncedCount(newSessionCount);
        setUnsyncedInterviews(newInterviewCount);
        
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const activeWorker = registration.active;
          
          if (activeWorker) {
            activeWorker.postMessage({
              type: 'SYNC_COMPLETE',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error("Error during debounced sync:", error);
    } finally {
      await releaseSyncLock(syncId);
      setIsSyncing(false);
    }
  }, []);

  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      const isCurrentlyOffline = !isOnline();
      
      setSyncState({
        isOffline: isCurrentlyOffline,
        unsyncedSessions: status.sessionsUnsynced,
        unsyncedInterviews: status.interviewsUnsynced,
        lastSyncAttempt: status.lastSync,
        isSyncInProgress: status.currentLock?.isLocked === 1
      });
    } catch (err) {
      console.error("Error updating sync status:", err);
    }
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) {
      toast({
        title: "Sync In Progress",
        description: "A synchronization is already in progress",
      });
      return;
    }
    
    toast({
      title: "Syncing",
      description: "Synchronizing your data...",
    });
    
    await debouncedSync();
  };

  useEffect(() => {
    updateSyncStatus();
    const intervalId = setInterval(updateSyncStatus, 10000);
    return () => clearInterval(intervalId);
  }, [updateSyncStatus]);

  useEffect(() => {
    const checkOnlineStatus = () => {
      const nowOnline = isOnline();
      if (!isOffline && !nowOnline) {
        toast({
          title: "You are offline",
          description: "Your work will be saved locally and synchronized when you reconnect.",
        });
      } else if (isOffline && nowOnline) {
        toast({
          title: "You are back online",
          description: "Your offline work will now be synchronized.",
        });
        debouncedSync();
      }
      
      setIsOffline(!nowOnline);
    };
    
    const checkUnsyncedItems = async () => {
      const sessionCount = await getUnsyncedSessionsCount();
      const interviewCount = await getUnsyncedInterviewsCount();
      setUnsyncedCount(sessionCount);
      setUnsyncedInterviews(interviewCount);
    };
    
    checkOnlineStatus();
    checkUnsyncedItems();
    
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    const intervalId = setInterval(checkUnsyncedItems, 30000);
    
    const setupServiceWorkerListener = async () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_SESSIONS') {
            console.log("Received sync request from service worker:", event.data);
            debouncedSync();
          }
        });
      }
    };
    
    setupServiceWorkerListener();
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(intervalId);
    };
  }, [isOffline, debouncedSync, toast]);

  useEffect(() => {
    if (!isOffline && (unsyncedCount > 0 || unsyncedInterviews > 0) && !isSyncing) {
      debouncedSync();
    }
  }, [isOffline, unsyncedCount, unsyncedInterviews, isSyncing, debouncedSync]);

  return {
    syncState,
    isOffline,
    unsyncedCount,
    unsyncedInterviews,
    isSyncing,
    handleManualSync,
    debouncedSync
  };
};
