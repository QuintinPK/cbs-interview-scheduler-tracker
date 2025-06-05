
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { isOnline } from '@/lib/offlineDB';
import SyncProgressSection from './SyncProgressSection';
import SyncDetailsSection from './SyncDetailsSection';

interface SyncStatusDisplayProps {
  status: any;
  isSyncing: boolean;
  totalUnsynced: number;
  totalItems: number;
  syncProgress: number;
  onManualSync: () => void;
}

const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({
  status,
  isSyncing,
  totalUnsynced,
  totalItems,
  syncProgress,
  onManualSync
}) => {
  const [isOffline, setIsOffline] = useState(!isOnline());
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
        <SyncProgressSection
          syncProgress={syncProgress}
          totalUnsynced={totalUnsynced}
          isSyncing={isSyncing}
        />
        
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            className="text-xs h-7"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
        
        <SyncDetailsSection
          status={status}
          showDetails={showDetails}
        />
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button
          onClick={onManualSync} 
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

export default SyncStatusDisplay;
