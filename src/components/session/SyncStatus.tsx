
import React from 'react';
import { initializeSync, requestSync } from '@/registerSW';
import { syncQueue } from '@/lib/syncQueue';

interface SyncStatusProps {
  isOffline?: boolean;
  unsyncedCount?: number;
  isLoading?: boolean;
  onSyncRequested?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
  isOffline = false,
  unsyncedCount = 0,
  isLoading = false,
  onSyncRequested
}) => {
  const handleSync = () => {
    requestSync();
    if (onSyncRequested) {
      onSyncRequested();
    }
  };

  if (isOffline) {
    return (
      <div className="p-2 bg-yellow-50 rounded-md text-yellow-800 text-sm">
        <p className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Offline Mode
        </p>
      </div>
    );
  }

  if (unsyncedCount > 0) {
    return (
      <div className="p-2 bg-blue-50 rounded-md text-blue-800 text-sm">
        <p className="flex items-center justify-between">
          <span>{unsyncedCount} item(s) waiting to sync</span>
          <button 
            onClick={handleSync}
            disabled={isLoading}
            className="ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </p>
      </div>
    );
  }

  return null;
};

export default SyncStatus;
