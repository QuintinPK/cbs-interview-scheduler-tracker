
import { isOnline } from '../offlineDB';
import { syncQueueDB } from './database';
import { processSessionOperation } from './sessionProcessor';
import { processInterviewOperation } from './interviewProcessor';
import { SyncOperation, SyncOperationStatus, SyncOperationType, createSyncOperation } from './types';

// Max attempts before considering an operation failed permanently
const MAX_RETRY_ATTEMPTS = 5;

// Sync Queue Manager
export class SyncQueueManager {
  private syncInProgress = false;
  private syncTimeoutId: number | null = null;
  
  // Queue a new sync operation
  async queueOperation(
    type: SyncOperationType,
    data: any,
    options: {
      offlineId?: number | string | null,
      onlineId?: string | null,
      priority?: number,
      entityType: 'session' | 'interview'
    }
  ): Promise<string> {
    // Create operation object
    const operation = createSyncOperation(type, data, options);
    
    // Store in IndexedDB
    await syncQueueDB.addOperation(operation);
    
    // If we're online, trigger sync immediately
    if (isOnline()) {
      this.attemptSync();
    }
    
    return operation.id;
  }
  
  // Attempt to process the sync queue
  async attemptSync(force: boolean = false): Promise<boolean> {
    // Don't start a new sync if one is already in progress
    if (this.syncInProgress && !force) {
      console.log('[SyncQueue] Sync already in progress');
      return false;
    }
    
    // Cancel any pending sync timeout
    if (this.syncTimeoutId !== null) {
      window.clearTimeout(this.syncTimeoutId);
      this.syncTimeoutId = null;
    }
    
    // Don't sync if offline
    if (!isOnline()) {
      console.log('[SyncQueue] Cannot sync while offline');
      return false;
    }
    
    try {
      this.syncInProgress = true;
      
      // Get operations that need processing, ordered by priority and creation time
      const pendingOperations = await syncQueueDB.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        console.log('[SyncQueue] No pending operations to sync');
        this.syncInProgress = false;
        return true;
      }
      
      console.log(`[SyncQueue] Processing ${pendingOperations.length} operations`);
      
      // Process operations in batches by type for efficiency
      // First sync sessions, then interviews
      const sessionOperations = pendingOperations.filter(op => op.entityType === 'session');
      const interviewOperations = pendingOperations.filter(op => op.entityType === 'interview');
      
      // Process sessions first
      await this.processBatch(sessionOperations);
      
      // Then process interviews
      await this.processBatch(interviewOperations);
      
      console.log('[SyncQueue] Sync completed successfully');
      
      return true;
    } catch (error) {
      console.error('[SyncQueue] Error during sync:', error);
      return false;
    } finally {
      this.syncInProgress = false;
      
      // Schedule next sync attempt if there are still pending items
      const pendingCount = await syncQueueDB.getPendingCount();
        
      if (pendingCount > 0) {
        // Use exponential backoff for retries
        const baseDelay = 15000; // 15 seconds
        this.syncTimeoutId = window.setTimeout(() => {
          this.attemptSync();
        }, baseDelay);
      }
    }
  }
  
  // Process a batch of operations of the same entity type
  private async processBatch(operations: SyncOperation[]): Promise<void> {
    for (const operation of operations) {
      try {
        // Mark as in progress
        await syncQueueDB.updateOperationStatus(operation.id, 'IN_PROGRESS', {
          attemptCount: operation.attemptCount + 1
        });
        
        // Process based on entity type
        let success = false;
        
        if (operation.entityType === 'session') {
          success = await processSessionOperation(operation);
        } else if (operation.entityType === 'interview') {
          success = await processInterviewOperation(operation);
        } else {
          console.warn(`[SyncQueue] Unknown entity type: ${operation.entityType}`);
        }
        
        if (success) {
          // Mark as complete
          await syncQueueDB.updateOperationStatus(operation.id, 'COMPLETE');
        } else {
          // Check if we've exceeded max retries
          if (operation.attemptCount >= MAX_RETRY_ATTEMPTS) {
            await syncQueueDB.updateOperationStatus(operation.id, 'ERROR', {
              lastError: 'Maximum retry attempts reached'
            });
          } else {
            // Mark as failed for retry
            await syncQueueDB.updateOperationStatus(operation.id, 'FAILED');
          }
        }
      } catch (error) {
        console.error(`[SyncQueue] Error processing operation ${operation.id}:`, error);
        
        // Update with error info
        await syncQueueDB.updateOperationStatus(
          operation.id, 
          operation.attemptCount >= MAX_RETRY_ATTEMPTS ? 'ERROR' : 'FAILED',
          {
            lastError: error instanceof Error ? error.message : String(error)
          }
        );
      }
    }
  }
  
  // Get pending operations count
  async getPendingCount(): Promise<number> {
    return await syncQueueDB.getPendingCount();
  }
  
  // Get all operations with a specific status
  async getOperationsByStatus(status: SyncOperationStatus | SyncOperationStatus[]): Promise<SyncOperation[]> {
    return await syncQueueDB.getOperationsByStatus(status);
  }
  
  // Clear completed operations older than specified days
  async clearCompletedOperations(olderThanDays: number = 7): Promise<number> {
    return await syncQueueDB.clearCompletedOperations(olderThanDays);
  }
  
  // Reset failed operations to pending
  async resetFailedOperations(): Promise<number> {
    const operations = await syncQueueDB.getOperationsByStatus('FAILED');
    
    let count = 0;
    for (const operation of operations) {
      await syncQueueDB.updateOperationStatus(operation.id, 'PENDING');
      count++;
    }
    
    return count;
  }
}
