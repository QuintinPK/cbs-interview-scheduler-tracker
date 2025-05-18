
import { SyncQueueManager } from './sync/syncManager';
import { syncQueueDB } from './sync/database';
import { isOnline } from './offlineDB';
import { type SyncOperation, type SyncOperationStatus, type SyncOperationType } from './sync/types';

// Export singleton instance
const syncQueue = new SyncQueueManager();

// Helper function to initialize sync queue when the app starts
async function initializeSyncQueue(): Promise<void> {
  // Check for and clean up any operations stuck in "IN_PROGRESS" state (e.g., after app crash)
  const stuckOperations = await syncQueueDB.getOperationsByStatus('IN_PROGRESS');
    
  if (stuckOperations.length > 0) {
    console.log(`[SyncQueue] Found ${stuckOperations.length} stuck operations, resetting to PENDING`);
    
    for (const operation of stuckOperations) {
      await syncQueueDB.updateOperationStatus(operation.id, 'PENDING');
    }
  }
  
  // Clean up old completed operations
  await syncQueue.clearCompletedOperations();
  
  // If we're online, attempt to process any pending operations
  if (isOnline()) {
    syncQueue.attemptSync();
  }
}

// Re-export everything
export { 
  syncQueue, 
  syncQueueDB, 
  initializeSyncQueue 
};
export type { SyncOperation, SyncOperationStatus, SyncOperationType };
