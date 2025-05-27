
import { getSyncManager, initializeSyncManager } from './sync';
import { syncQueueDB } from './sync/database';
import { isOnline } from './offlineDB';
import { type SyncOperation, type SyncOperationStatus, type SyncOperationType } from './sync/types';

// Get singleton instance
const getSyncQueue = () => getSyncManager();

// Helper function to initialize sync queue when the app starts
async function initializeSyncQueue(): Promise<void> {
  console.log('[SyncQueue] Initializing sync queue');
  
  try {
    // Use the new initialization function
    await initializeSyncManager();
    
    // If we're online, attempt to process any pending operations
    if (isOnline()) {
      console.log('[SyncQueue] Online, attempting to sync pending operations');
      const syncManager = getSyncManager();
      await syncManager.attemptSync(true);
    } else {
      console.log('[SyncQueue] Offline, sync will be attempted when online');
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SyncQueue] Error initializing sync queue:', error);
    return Promise.reject(error);
  }
}

// Export the sync queue getter instead of a direct instance
export { 
  getSyncQueue as syncQueue,
  syncQueueDB, 
  initializeSyncQueue 
};
export type { SyncOperation, SyncOperationStatus, SyncOperationType };
