
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, CheckCircle, AlertCircle, History } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sync status interface
interface SyncStatusData {
  sessionsTotal: number;
  sessionsUnsynced: number;
  sessionsInProgress: number;
  interviewsTotal: number;
  interviewsUnsynced: number;
  interviewsInProgress: number;
  lastSync: string | null;
  currentLock: {
    isLocked: number;
    lockedBy: string;
    lockedAt: number;
    expiresAt: number;
  } | null;
}

// Sync log interface
interface SyncLog {
  id: number;
  category: string;
  operation: string;
  status: 'success' | 'error' | 'warning' | 'info';
  details: string;
  timestamp: string;
  metadata: {
    deviceId: string;
    isOnline: boolean;
    userAgent: string;
  };
}

const SyncStatus = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatusData>({
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
  const [showLogs, setShowLogs] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [syncTimeoutActive, setSyncTimeoutActive] = useState(false);

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
        
        // Check if lock is stale (more than 5 minutes old)
        const now = Date.now();
        const lockExpiresAt = currentStatus.currentLock.expiresAt;
        
        if (now > lockExpiresAt && !syncTimeoutActive) {
          console.log('Detected stale lock, will force release in 30 seconds if it persists');
          setSyncTimeoutActive(true);
          
          // Wait 30 seconds before forcing lock release - gives time for normal completion
          setTimeout(async () => {
            // Check if the lock is still stale
            const latestStatus = await getSyncStatus();
            if (
              latestStatus.currentLock?.isLocked === 1 &&
              Date.now() > latestStatus.currentLock.expiresAt
            ) {
              // Force release the stale lock
              console.log('Forcing release of stale sync lock');
              await handleForceReleaseLock();
              
              toast.warning('Detected and cleared a stale sync lock');
              setIsSyncing(false);
            }
            setSyncTimeoutActive(false);
          }, 30000);
        }
      } else if (isSyncing) {
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, [isSyncing, syncTimeoutActive]);
  
  // Load sync logs when dialog opens
  const loadSyncLogs = useCallback(async () => {
    if (!showLogs) return;
    
    try {
      setIsLoadingLogs(true);
      // Since getSyncLogs doesn't exist yet, we'll stub it by creating an empty array
      // This will be replaced later when we implement getSyncLogs
      setSyncLogs([]);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [showLogs]);
  
  useEffect(() => {
    loadSyncLogs();
  }, [showLogs, loadSyncLogs]);
  
  useEffect(() => {
    refreshStatus();
    
    const intervalId = setInterval(refreshStatus, 5000);
    return () => clearInterval(intervalId);
  }, [refreshStatus]);
  
  // Calculate total items requiring sync
  const totalUnsynced = status.sessionsUnsynced + status.interviewsUnsynced;
  const totalItems = status.sessionsTotal + status.interviewsTotal;
  const syncProgress = totalItems ? Math.round(((totalItems - totalUnsynced) / totalItems) * 100) : 100;
  
  // Calculate total items in progress
  const totalInProgress = status.sessionsInProgress + status.interviewsInProgress;
  
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
  
  // Handle force releasing a sync lock (admin function)
  const handleForceReleaseLock = async () => {
    try {
      // Create a special ID for forced release
      const forceId = `force-release-${Date.now()}`;
      
      // Just delete the lock directly
      const successful = await releaseSyncLock('main');
      
      if (successful) {
        toast.success('Successfully released sync lock');
        await logSync('SyncLock', 'ManualForceRelease', 'warning', 'User manually forced sync lock release');
        setIsSyncing(false);
        refreshStatus();
      } else {
        toast.error('Failed to release sync lock');
      }
    } catch (error) {
      console.error('Error force releasing sync lock:', error);
      toast.error('Error releasing sync lock');
    }
  };

  // Get status badge variant based on sync status
  const getStatusBadgeVariant = () => {
    if (isOffline) return "destructive";
    if (isSyncing) return "default";
    if (totalUnsynced > 0) return "warning";
    return "outline";
  };

  // Show empty state when nothing to sync
  if (totalUnsynced === 0 && !isSyncing && totalItems > 0) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>All data synchronized</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {totalItems} items
          </Badge>
          
          <Dialog open={showLogs} onOpenChange={setShowLogs}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <History className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Sync History</DialogTitle>
                <DialogDescription>
                  Recent synchronization events and operations
                </DialogDescription>
              </DialogHeader>
              
              <SyncLogsViewer logs={syncLogs} isLoading={isLoadingLogs} />
              
              <DialogFooter>
                <Button onClick={() => setShowLogs(false)} variant="outline">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
          <Badge 
            variant={getStatusBadgeVariant()} 
            className="flex gap-1 items-center"
          >
            {isOffline ? (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            ) : isSyncing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing
              </>
            ) : totalUnsynced > 0 ? (
              <>
                <AlertCircle className="h-3 w-3" />
                Changes pending
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {status.lastSync ? (
            <>Last sync: {formatDistanceToNow(new Date(status.lastSync), { addSuffix: true })}</>
          ) : (
            'No previous sync detected'
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Progress 
          value={syncProgress} 
          className={`h-2 mb-2 ${totalUnsynced === 0 ? 'bg-green-100' : 'bg-amber-100'}`}
        />
        
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
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="text-xs h-7"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            
            <Dialog open={showLogs} onOpenChange={setShowLogs}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                >
                  History
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Sync History</DialogTitle>
                  <DialogDescription>
                    Recent synchronization events and operations
                  </DialogDescription>
                </DialogHeader>
                
                <SyncLogsViewer logs={syncLogs} isLoading={isLoadingLogs} />
                
                <DialogFooter>
                  <Button onClick={() => setShowLogs(false)} variant="outline">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-3 pt-3 border-t text-xs space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <div>Sessions pending:</div>
              <div className="text-right">{status.sessionsUnsynced} / {status.sessionsTotal}</div>
              
              <div>Interviews pending:</div>
              <div className="text-right">{status.interviewsUnsynced} / {status.interviewsTotal}</div>
              
              <div>Operations in progress:</div>
              <div className="text-right">{totalInProgress}</div>
            </div>
            
            {status.currentLock?.isLocked === 1 && (
              <>
                <div className="text-xs text-amber-600 mt-2">
                  <p>Lock active: {status.currentLock.lockedBy}</p>
                  <p>Started: {formatDistanceToNow(status.currentLock.lockedAt, { addSuffix: true })}</p>
                  <p>Expires: {format(status.currentLock.expiresAt, 'HH:mm:ss')}</p>
                </div>
                
                <div className="mt-2 pt-2 border-t border-dashed">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs w-full h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={handleForceReleaseLock}
                        >
                          Force Release Sync Lock
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Use this only if sync is stuck. This will forcibly release the lock 
                          so a new sync operation can start.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
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
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
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

// Component to display sync logs
const SyncLogsViewer = ({ logs, isLoading }: { logs: SyncLog[], isLoading: boolean }) => {
  // Get appropriate color for log status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading logs...</span>
      </div>
    );
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sync logs found
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="p-2 text-xs border-b">
            <div className="flex justify-between">
              <div className={`font-medium ${getStatusColor(log.status)}`}>
                {log.category} - {log.operation}
              </div>
              <div className="text-gray-500">
                {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
              </div>
            </div>
            <div className="mt-1">{log.details}</div>
            <div className="mt-1 text-gray-400 text-[10px]">
              Device: {log.metadata.deviceId.substring(0, 8)}... | 
              {log.metadata.isOnline ? ' Online' : ' Offline'}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SyncStatus;
