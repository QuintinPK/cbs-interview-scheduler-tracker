
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { 
  isOnline, 
  getSyncStatus, 
  syncOfflineSessions,
  acquireSyncLock,
  releaseSyncLock,
  logSync
} from '@/lib/offlineDB';
import { syncQueue, SyncOperation, SyncOperationType } from '@/lib/syncQueue';
import { requestSync } from '@/registerSW';

// Group operations by their type for better display
function groupOperationsByType(operations: SyncOperation[]) {
  const groupedOps: Record<string, number> = {};
  
  operations.forEach(op => {
    const type = op.type;
    if (!groupedOps[type]) {
      groupedOps[type] = 0;
    }
    groupedOps[type]++;
  });
  
  return groupedOps;
}

// Format operation type for display
function formatOperationType(type: SyncOperationType): string {
  switch (type) {
    case 'SESSION_START': return 'Session start';
    case 'SESSION_END': return 'Session end';
    case 'INTERVIEW_START': return 'Interview start';
    case 'INTERVIEW_END': return 'Interview end';
    case 'INTERVIEW_RESULT': return 'Interview result';
    case 'SESSION_UPDATE': return 'Session update';
    case 'INTERVIEW_UPDATE': return 'Interview update';
    default: return type;
  }
}

const EnhancedSyncStatus = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  const [inProgressOperations, setInProgressOperations] = useState<SyncOperation[]>([]);
  const [failedOperations, setFailedOperations] = useState<SyncOperation[]>([]);
  const [completedOperations, setCompletedOperations] = useState<SyncOperation[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [syncProgress, setSyncProgress] = useState(100);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Update status when network connection changes
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOffline(!isOnline());
    };
    
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  // Fetch operation status from sync queue
  const fetchSyncOperations = useCallback(async () => {
    try {
      const pending = await syncQueue.getOperationsByStatus('PENDING');
      const inProgress = await syncQueue.getOperationsByStatus('IN_PROGRESS');
      const failed = await syncQueue.getOperationsByStatus('FAILED');
      const completed = await syncQueue.getOperationsByStatus('COMPLETE');
      
      setPendingOperations(pending);
      setInProgressOperations(inProgress);
      setFailedOperations(failed);
      setCompletedOperations(completed);
      
      // Calculate overall progress
      const total = pending.length + inProgress.length + failed.length + completed.length;
      if (total === 0) {
        setSyncProgress(100);
      } else {
        const progress = Math.round((completed.length / total) * 100);
        setSyncProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching sync operations:', error);
    }
  }, []);

  // Get sync status from offline DB
  const fetchSyncStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      setLastSyncTime(status.lastSync);
      
      if (status.currentLock?.isLocked === 1) {
        setIsSyncing(true);
      } else if (isSyncing && inProgressOperations.length === 0) {
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  }, [isSyncing, inProgressOperations.length]);

  // Periodically refresh both statuses
  useEffect(() => {
    fetchSyncOperations();
    fetchSyncStatus();
    
    const intervalId = setInterval(() => {
      fetchSyncOperations();
      fetchSyncStatus();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [fetchSyncOperations, fetchSyncStatus]);

  // Handle manual sync
  const handleSync = async () => {
    if (isOffline) {
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
          // Fall back to direct sync using sync queue
          await syncQueue.attemptSync(true);
        }
        
        // Check completion after a short delay
        setTimeout(async () => {
          await fetchSyncOperations();
          await fetchSyncStatus();
          
          if (pendingOperations.length === 0 && inProgressOperations.length === 0 && failedOperations.length === 0) {
            toast.success('Synchronization completed successfully');
          } else {
            toast.info('Sync is continuing in the background');
          }
          
          setIsSyncing(false);
          await releaseSyncLock(syncId);
        }, 5000);
        
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
  };
  
  // Handle resetting failed operations
  const handleResetFailed = async () => {
    try {
      const count = await syncQueue.resetFailedOperations();
      toast.success(`Reset ${count} failed operation${count === 1 ? '' : 's'}`);
      await fetchSyncOperations();
    } catch (error) {
      console.error('Error resetting failed operations:', error);
      toast.error('Failed to reset operations');
    }
  };

  // Combined count of operations that need syncing
  const totalUnsynced = pendingOperations.length + inProgressOperations.length + failedOperations.length;

  // If nothing to sync and not syncing, show minimal UI
  if (totalUnsynced === 0 && !isSyncing && completedOperations.length > 0) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>All data synchronized</span>
          {lastSyncTime && (
            <span className="text-xs text-green-600">
              Last: {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {completedOperations.length} synced
          </Badge>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 p-1"
            onClick={handleSync}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Show nothing if there's no operations at all
  if (totalUnsynced === 0 && !isSyncing && completedOperations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">Synchronization Status</CardTitle>
          <Badge variant={isOffline ? "destructive" : "outline"} className="flex gap-1 items-center">
            {isOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            {isOffline ? "Offline" : "Online"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {lastSyncTime ? `Last sync: ${new Date(lastSyncTime).toLocaleString()}` : 'No previous sync detected'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Progress value={syncProgress} className="h-2 mb-2" />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {totalUnsynced > 0 ? (
                <>
                  <span className="text-amber-600">{totalUnsynced}</span> {totalUnsynced === 1 ? 'item' : 'items'} need to sync
                </>
              ) : isSyncing ? (
                <span className="text-blue-600">Syncing in progress...</span>
              ) : (
                <span className="text-green-600">All data synced</span>
              )}
            </p>
          </div>
          
          <Button
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            className="text-xs h-7"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t text-xs space-y-2">
            {/* Pending Operations */}
            {pendingOperations.length > 0 && (
              <div className="mb-2">
                <p className="font-medium text-amber-600 mb-1">Pending ({pendingOperations.length})</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(groupOperationsByType(pendingOperations)).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{formatOperationType(type as SyncOperationType)}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* In Progress Operations */}
            {inProgressOperations.length > 0 && (
              <div className="mb-2">
                <p className="font-medium text-blue-600 mb-1">In Progress ({inProgressOperations.length})</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(groupOperationsByType(inProgressOperations)).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{formatOperationType(type as SyncOperationType)}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Failed Operations */}
            {failedOperations.length > 0 && (
              <div className="mb-2">
                <p className="font-medium text-red-600 mb-1">Failed ({failedOperations.length})</p>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  {Object.entries(groupOperationsByType(failedOperations)).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{formatOperationType(type as SyncOperationType)}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full h-6 text-xs mt-1" 
                  onClick={handleResetFailed}
                >
                  Retry Failed Operations
                </Button>
              </div>
            )}
            
            {/* Completed Operations */}
            {completedOperations.length > 0 && (
              <div>
                <p className="font-medium text-green-600 mb-1">Completed ({completedOperations.length})</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(groupOperationsByType(completedOperations)).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{formatOperationType(type as SyncOperationType)}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button
          onClick={handleSync} 
          disabled={isOffline || isSyncing || totalUnsynced === 0}
          size="sm"
          className="w-full"
          variant={totalUnsynced > 0 ? "default" : "outline"}
        >
          {isSyncing ? (
            <>
              <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
              Syncing...
            </>
          ) : totalUnsynced > 0 ? (
            `Synchronize ${totalUnsynced} ${totalUnsynced === 1 ? 'item' : 'items'}`
          ) : (
            'Nothing to sync'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedSyncStatus;
