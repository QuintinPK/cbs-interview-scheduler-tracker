
import React, { useState, useEffect } from 'react';
import { syncQueue } from '@/lib/syncQueue';
import { getSyncStatus, isOnline } from '@/lib/offlineDB';
import { requestSync } from '@/registerSW';

const EnhancedSyncStatus: React.FC = () => {
  const [syncState, setSyncState] = useState({
    isOffline: !isOnline(),
    unsyncedSessions: 0,
    unsyncedInterviews: 0,
    lastSyncAttempt: null as string | null,
    isSyncInProgress: false
  });

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = async () => {
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
    };
    
    // Update immediately
    updateSyncStatus();
    
    // Then update periodically
    const intervalId = setInterval(updateSyncStatus, 10000); // Every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle manual sync request
  const handleSyncRequest = () => {
    if (syncState.isSyncInProgress) return;
    
    requestSync();
    
    // Update UI to show sync in progress
    setSyncState(prev => ({
      ...prev,
      isSyncInProgress: true
    }));
    
    // Reset sync in progress after a timeout (in case we don't get status updates)
    setTimeout(() => {
      setSyncState(prev => ({
        ...prev,
        isSyncInProgress: false
      }));
    }, 10000);
  };

  if (syncState.isOffline) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
        <p className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          You are currently offline. Data will sync when you're back online.
        </p>
      </div>
    );
  }

  if (syncState.unsyncedSessions > 0 || syncState.unsyncedInterviews > 0) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
        <p className="flex items-center justify-between">
          <span>
            {syncState.unsyncedSessions > 0 && `${syncState.unsyncedSessions} session${syncState.unsyncedSessions === 1 ? '' : 's'}`}
            {syncState.unsyncedSessions > 0 && syncState.unsyncedInterviews > 0 && ' and '}
            {syncState.unsyncedInterviews > 0 && `${syncState.unsyncedInterviews} interview${syncState.unsyncedInterviews === 1 ? '' : 's'}`}
            {' waiting to sync'}
          </span>
          <button 
            onClick={handleSyncRequest}
            disabled={syncState.isSyncInProgress}
            className={`ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs ${syncState.isSyncInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {syncState.isSyncInProgress ? 'Syncing...' : 'Sync Now'}
          </button>
        </p>
        {syncState.lastSyncAttempt && (
          <p className="text-xs mt-1">Last sync attempt: {new Date(syncState.lastSyncAttempt).toLocaleTimeString()}</p>
        )}
      </div>
    );
  }

  return null;
};

export default EnhancedSyncStatus;
