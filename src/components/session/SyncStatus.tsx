// In src/components/session/SyncStatus.tsx
// Replace with this enhanced version:

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { WifiOff, Info as InfoIcon, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getSyncManager, SyncStatusSummary } from '@/lib/sync';
import { isOnline } from '@/lib/offlineDB';

// Simple spinner component
const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <RefreshCw className={`${sizeClass} animate-spin ${className}`} />
  );
};

export const SyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusSummary>({
    isOnline: isOnline(),
    pendingCount: 0,
    failedCount: 0,
    errorCount: 0,
    lastSyncAttempt: null,
    syncInProgress: false,
    syncLockId: null
  });
  
  useEffect(() => {
    const syncManager = getSyncManager();
    
    // Initial status fetch
    const fetchStatus = async () => {
      const currentStatus = await syncManager.getSyncStatus();
      setStatus(currentStatus);
    };
    
    fetchStatus();
    
    // Subscribe to status updates
    const unsubscribe = syncManager.subscribe(async (update) => {
      // Refresh full status on important events
      if (
        update.type === 'SYNC_COMPLETED' || 
        update.type === 'SYNC_STARTED' || 
        update.type === 'OPERATIONS_RESET'
      ) {
        fetchStatus();
      }
    });
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchStatus, 10000);
    
    // Set up online/offline listener
    const handleOnlineStatusChange = () => {
      setStatus(prev => ({ ...prev, isOnline: isOnline() }));
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);
  
  // Determine status text and color
  let statusText = 'Unknown';
  let statusColor = 'bg-gray-400';
  
  const { isOnline: online, pendingCount, failedCount, errorCount, syncInProgress, lastSyncAttempt } = status;
  
  if (!online) {
    statusText = 'Offline';
    statusColor = 'bg-amber-500';
  } else if (syncInProgress) {
    statusText = 'Syncing...';
    statusColor = 'bg-blue-500 animate-pulse';
  } else if (errorCount > 0) {
    statusText = 'Sync Error';
    statusColor = 'bg-red-500';
  } else if (failedCount > 0) {
    statusText = 'Sync Pending';
    statusColor = 'bg-amber-500';
  } else if (pendingCount > 0) {
    statusText = 'Sync Pending';
    statusColor = 'bg-amber-500';
  } else {
    statusText = 'Synced';
    statusColor = 'bg-green-500';
  }
  
  // Handle manual sync trigger
  const handleManualSync = async () => {
    if (!online || syncInProgress) return;
    
    try {
      const syncManager = getSyncManager();
      await syncManager.resetFailedOperations();
      syncManager.attemptSync(true);
    } catch (error) {
      console.error("Error triggering manual sync:", error);
    }
  };
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
      <span>{statusText}</span>
      
      {pendingCount > 0 && (
        <Badge variant="outline" className="ml-2">
          {pendingCount} pending
        </Badge>
      )}
      
      {failedCount > 0 && (
        <Badge variant="destructive" className="ml-2">
          {failedCount} failed
        </Badge>
      )}
      
      {syncInProgress && <Spinner size="sm" className="ml-2" />}
      
      {!online && (
        <Tooltip content="You're offline. Changes will sync when you reconnect.">
          <WifiOff className="w-4 h-4 text-muted-foreground ml-2" />
        </Tooltip>
      )}
      
      {lastSyncAttempt && (
        <Tooltip content={`Last sync: ${formatDistanceToNow(new Date(lastSyncAttempt))} ago`}>
          <InfoIcon className="w-4 h-4 text-muted-foreground ml-2" />
        </Tooltip>
      )}
      
      {online && !syncInProgress && (pendingCount > 0 || failedCount > 0) && (
        <button 
          onClick={handleManualSync}
          className="ml-2 text-xs text-blue-500 hover:text-blue-700 flex items-center"
        >
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </button>
      )}
    </div>
  );
};

export default SyncStatus;
