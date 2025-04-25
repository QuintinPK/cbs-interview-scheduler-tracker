
import React from "react";
import { useOffline } from "@/contexts/OfflineContext";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Wifi, WifiOff, Loader2, Save } from "lucide-react";

const SyncStatusBar: React.FC = () => {
  const { 
    isOnline, 
    syncStatus, 
    syncNow 
  } = useOffline();
  
  // Derive the values we need from syncStatus
  const isSyncing = syncStatus?.isSyncing || false;
  const lastSyncTime = syncStatus?.lastSuccessfulSync;

  // Calculate unsynced items (in a real app, this would come from your context)
  // This is a placeholder - you might want to implement the actual count in the OfflineContext
  const unsyncedCount = 0; 
  
  const handleSyncNow = () => {
    syncNow();
  };
  
  return (
    <div className="bg-white border-t border-gray-200 py-2 px-4 fixed bottom-0 left-0 right-0 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">
          {isOnline ? "Online" : "Offline"}
        </span>
        
        {unsyncedCount > 0 && (
          <div className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            {unsyncedCount} unsynced
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-xs text-gray-500">
          {lastSyncTime 
            ? `Last synced: ${formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}` 
            : "Never synced"}
        </span>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleSyncNow} 
          disabled={!isOnline || isSyncing || unsyncedCount === 0}
          className="text-xs flex items-center space-x-1"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              <span>Sync Now</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SyncStatusBar;
