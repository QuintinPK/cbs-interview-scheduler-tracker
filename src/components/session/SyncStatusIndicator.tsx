import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSyncStatus, syncOfflineSessions, isOnline } from '@/lib/offlineDB';

interface SyncStatusProps {
  className?: string;
}

interface SyncStatus {
  sessionsTotal: number;
  sessionsUnsynced: number;
  sessionsInProgress: number;
  interviewsTotal: number;
  interviewsUnsynced: number;
  interviewsInProgress: number;
  lastSync: string;
  currentLock: any;
}

const SyncStatusIndicator: React.FC<SyncStatusProps> = ({ className }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState(navigator.onLine);
  const { toast } = useToast();

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch sync status periodically
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const status = await getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Error fetching sync status:', error);
      }
    };

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (isOnlineStatus && syncStatus && (syncStatus.sessionsUnsynced > 0 || syncStatus.interviewsUnsynced > 0)) {
      handleSync();
    }
  }, [isOnlineStatus]);

  const handleSync = async () => {
    if (!isOnlineStatus) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline. Data will sync automatically when online.",
        variant: "destructive",
      });
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncOfflineSessions();
      
      // Refresh status after sync
      const newStatus = await getSyncStatus();
      setSyncStatus(newStatus);
      
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized.",
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some data could not be synchronized. Will retry automatically.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!syncStatus) return null;

  const hasUnsyncedData = syncStatus.sessionsUnsynced > 0 || syncStatus.interviewsUnsynced > 0;
  const showSyncIndicator = hasUnsyncedData || !isOnlineStatus;

  if (!showSyncIndicator) return null;

  return (
    <Card className={`p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isOnlineStatus ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isOnlineStatus ? 'Online' : 'Offline'}
              </span>
              {hasUnsyncedData && (
                <Badge variant="outline" className="text-xs">
                  {syncStatus.sessionsUnsynced + syncStatus.interviewsUnsynced} pending
                </Badge>
              )}
            </div>
            
            {hasUnsyncedData && (
              <div className="text-xs text-muted-foreground">
                {syncStatus.sessionsUnsynced > 0 && `${syncStatus.sessionsUnsynced} sessions`}
                {syncStatus.sessionsUnsynced > 0 && syncStatus.interviewsUnsynced > 0 && ', '}
                {syncStatus.interviewsUnsynced > 0 && `${syncStatus.interviewsUnsynced} interviews`}
              </div>
            )}
            
            {syncStatus.lastSync && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {hasUnsyncedData && isOnlineStatus && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Sync
              </>
            )}
          </Button>
        )}
        
        {syncStatus.currentLock && (
          <div className="h-4 w-4 text-yellow-500">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default SyncStatusIndicator;