
import React from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { WifiOff, AlertCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EnhancedSyncStatus = () => {
  const syncStatus = useSyncStatus();
  
  if (!syncStatus.pendingCount && !syncStatus.failedCount && !syncStatus.errorCount) {
    return null; // Don't show anything if everything is in sync
  }
  
  return (
    <div className="p-3 rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {!syncStatus.isOnline ? (
            <WifiOff className="h-4 w-4 text-yellow-600 mr-2" />
          ) : syncStatus.syncInProgress ? (
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin mr-2" />
          ) : syncStatus.failedCount > 0 ? (
            <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
          ) : syncStatus.errorCount > 0 ? (
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          )}
          <h3 className="text-sm font-medium">Sync Status</h3>
        </div>
        
        {syncStatus.isOnline && (
          <button
            onClick={() => syncStatus.retrySync()}
            disabled={syncStatus.syncInProgress}
            className={`text-xs px-2 py-1 rounded ${
              syncStatus.syncInProgress 
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
      
      <div className="space-y-1">
        {/* Pending items */}
        {syncStatus.pendingCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{syncStatus.pendingCount} pending</span>
            {syncStatus.lastSyncAttempt && (
              <span className="text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last attempt: {formatDistanceToNow(new Date(syncStatus.lastSyncAttempt))} ago
              </span>
            )}
          </div>
        )}
        
        {/* Failed items */}
        {syncStatus.failedCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-600">{syncStatus.failedCount} failed</span>
            {!syncStatus.syncInProgress && (
              <button
                onClick={() => syncStatus.resetFailedOperations()}
                className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                Retry Failed
              </button>
            )}
          </div>
        )}
        
        {/* Error items */}
        {syncStatus.errorCount > 0 && (
          <div className="text-xs text-red-600">
            {syncStatus.errorCount} operation{syncStatus.errorCount === 1 ? '' : 's'} with errors
          </div>
        )}
        
        {/* Offline mode notice */}
        {!syncStatus.isOnline && syncStatus.pendingCount > 0 && (
          <div className="text-xs text-yellow-600 mt-1">
            You're offline. Changes will sync when you reconnect.
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSyncStatus;
