
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  isOnline, 
  getSyncStatus, 
  syncOfflineSessions,
  acquireSyncLock,
  releaseSyncLock,
  logSync
} from '@/lib/offlineDB';
import { requestSync } from '@/registerSW';
import { Progress } from '@/components/ui/progress';

const SyncStatus = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
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
  const [showDetails, setShowDetails] = useState(false);

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

  // Periodically refresh sync status
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
  
  // Calculate total items requiring sync
  const totalUnsynced = status.sessionsUnsynced + status.interviewsUnsynced;
  const totalItems = status.sessionsTotal + status.interviewsTotal;
  const syncProgress = totalItems ? Math.round(((totalItems - totalUnsynced) / totalItems) * 100) : 100;
  
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
  };

  // Show empty state when nothing to sync
  if (totalUnsynced === 0 && !isSyncing && totalItems > 0) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>All data synchronized</span>
        </div>
        
        <Badge variant="outline" className="bg-green-100 text-green-800">
          {totalItems} items
        </Badge>
      </div>
    );
  }
  
  // Show nothing if there's no offline data at all
  if (totalItems === 0 && !isSyncing) {
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
          {status.lastSync ? `Last sync: ${new Date(status.lastSync).toLocaleString()}` : 'No previous sync detected'}
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
            <div className="grid grid-cols-2 gap-1">
              <div>Sessions pending:</div>
              <div className="text-right">{status.sessionsUnsynced} / {status.sessionsTotal}</div>
              
              <div>Interviews pending:</div>
              <div className="text-right">{status.interviewsUnsynced} / {status.interviewsTotal}</div>
              
              <div>Operations in progress:</div>
              <div className="text-right">{status.sessionsInProgress + status.interviewsInProgress}</div>
            </div>
            
            {status.currentLock?.isLocked === 1 && (
              <div className="text-xs text-amber-600 mt-2">
                <p>Lock active: {status.currentLock.lockedBy}</p>
                <p>Expires: {new Date(status.currentLock.expiresAt).toLocaleTimeString()}</p>
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

export default SyncStatus;
