
import { SyncQueueManager } from './sync/syncManager';
import { syncQueueDB } from './sync/database';
import { isOnline } from './offlineDB';
import { type SyncOperation, type SyncOperationStatus, type SyncOperationType } from './sync/types';

// Export singleton instance
const syncQueue = new SyncQueueManager();

// Helper function to initialize sync queue when the app starts
async function initializeSyncQueue(): Promise<void> {
  console.log('[SyncQueue] Initializing sync queue');
  
  try {
    // Check for and clean up any operations stuck in "IN_PROGRESS" state (e.g., after app crash)
    const stuckOperations = await syncQueueDB.getOperationsByStatus('IN_PROGRESS');
      
    if (stuckOperations.length > 0) {
      console.log(`[SyncQueue] Found ${stuckOperations.length} stuck operations, resetting to PENDING`);
      
      for (const operation of stuckOperations) {
        await syncQueueDB.updateOperationStatus(operation.id, 'PENDING');
      }
    }
    
    // Clean up old completed operations
    const deletedCount = await syncQueue.clearCompletedOperations();
    if (deletedCount > 0) {
      console.log(`[SyncQueue] Cleaned up ${deletedCount} old completed operations`);
    }
    
    // If we're online, attempt to process any pending operations
    if (isOnline()) {
      console.log('[SyncQueue] Online, attempting to sync pending operations');
      await syncQueue.attemptSync(true);
    } else {
      console.log('[SyncQueue] Offline, sync will be attempted when online');
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SyncQueue] Error initializing sync queue:', error);
    return Promise.reject(error);
  }
}

// Re-export everything with proper type exports
export { 
  syncQueue, 
  syncQueueDB, 
  initializeSyncQueue 
};
export type { SyncOperation, SyncOperationStatus, SyncOperationType };
