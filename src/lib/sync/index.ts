
// Main sync module - exports singleton instances and types
import { SyncQueueManager } from './syncManager';
import { syncQueueDB } from './database';

// Create singleton instance
export const syncQueueManager = new SyncQueueManager();

// Initialize function to set up sync system
export async function initializeSyncManager(): Promise<void> {
  console.log('[Sync] Initializing sync system');
  
  try {
    // Clean up any stuck operations from previous sessions
    const stuckOperations = await syncQueueDB.getOperationsByStatus('IN_PROGRESS');
    
    if (stuckOperations.length > 0) {
      console.log(`[Sync] Found ${stuckOperations.length} stuck operations, resetting to PENDING`);
      
      for (const operation of stuckOperations) {
        await syncQueueDB.updateOperationStatus(operation.id, 'PENDING');
      }
    }
    
    // Clean up old completed operations
    const deletedCount = await syncQueueManager.clearCompletedOperations();
    if (deletedCount > 0) {
      console.log(`[Sync] Cleaned up ${deletedCount} old completed operations`);
    }
    
    console.log('[Sync] Sync system initialized successfully');
  } catch (error) {
    console.error('[Sync] Error initializing sync system:', error);
    throw error;
  }
}

// Helper function to get the singleton instance
export function getSyncManager(): SyncQueueManager {
  return syncQueueManager;
}

// Re-export types and database
export { syncQueueDB } from './database';
export type { 
  SyncOperation, 
  SyncOperationStatus, 
  SyncOperationType 
} from './types';
export type { 
  SyncStatusUpdate, 
  SyncStatusSummary 
} from './syncManager';
