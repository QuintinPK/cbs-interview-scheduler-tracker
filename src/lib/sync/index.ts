
// Main sync module - exports singleton instances and types
import { SyncQueueManager } from './syncManager';
import { syncQueueDB } from './database';

// Create singleton instance
let syncManagerInstance: SyncQueueManager | null = null;

// Get singleton instance
export function getSyncManager(): SyncQueueManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncQueueManager();
  }
  return syncManagerInstance;
}

// Initialize function to set up sync system
export async function initializeSyncManager(): Promise<void> {
  console.log('[Sync] Initializing sync system');
  
  try {
    const manager = getSyncManager();
    
    // Clean up any stuck operations from previous sessions
    const stuckOperations = await syncQueueDB.getOperationsByStatus('IN_PROGRESS');
    
    if (stuckOperations.length > 0) {
      console.log(`[Sync] Found ${stuckOperations.length} stuck operations, resetting to PENDING`);
      
      for (const operation of stuckOperations) {
        await syncQueueDB.updateOperationStatus(operation.id, 'PENDING');
      }
    }
    
    // Clean up old completed operations
    const deletedCount = await manager.clearCompletedOperations();
    if (deletedCount > 0) {
      console.log(`[Sync] Cleaned up ${deletedCount} old completed operations`);
    }
    
    console.log('[Sync] Sync system initialized successfully');
  } catch (error) {
    console.error('[Sync] Error initializing sync system:', error);
    throw error;
  }
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
