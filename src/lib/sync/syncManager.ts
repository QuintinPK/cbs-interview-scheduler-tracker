
import { isOnline } from '../offlineDB';
import { syncQueueDB } from './database';
import { processSessionOperation } from './sessionProcessor';
import { processInterviewOperation } from './interviewProcessor';
import { SyncOperation, SyncOperationStatus, SyncOperationType, createSyncOperation } from './types';

// Max attempts before considering an operation failed permanently
const MAX_RETRY_ATTEMPTS = 5;
// Backoff delays for retries (in ms)
const RETRY_DELAYS = [5000, 15000, 30000, 60000, 120000]; // 5s, 15s, 30s, 1m, 2m

// Sync Queue Manager
export class SyncQueueManager {
  private syncInProgress = false;
  private syncTimeoutId: number | null = null;
  private syncLockId: string | null = null;
  private lastSyncAttempt: Date | null = null;
  private listeners: Array<(status: SyncStatusUpdate) => void> = [];
  
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
    try {
      // Validate data before queuing
      this.validateOperationData(type, data, options);
      
      // Create operation object
      const operation = createSyncOperation(type, data, options);
      
      // Log the operation being queued
      console.log(`[SyncQueue] Queuing operation: ${type} for ${options.entityType}`, 
        { offlineId: options.offlineId, onlineId: options.onlineId });
      
      // Store in IndexedDB
      const operationId = await syncQueueDB.addOperation(operation);
      
      // If we're online, trigger sync after a short delay
      if (isOnline()) {
        this.debouncedSync();
      }
      
      this.notifyListeners({
        type: 'OPERATION_QUEUED',
        operationId,
        operationType: type,
        entityType: options.entityType
      });
      
      return operationId;
    } catch (error) {
      console.error('[SyncQueue] Error queueing operation:', error);
      this.notifyListeners({
        type: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  // Validate operation data before queuing
  private validateOperationData(type: SyncOperationType, data: any, options: any): void {
    // Basic validation to ensure required fields are present
    if (!options.entityType) {
      throw new Error('Entity type is required');
    }
    
    // Specific validations based on operation type
    switch (type) {
      case 'SESSION_START':
        if (!data.interviewer_id || !data.project_id) {
          throw new Error('Interviewer ID and Project ID are required for SESSION_START');
        }
        break;
      case 'SESSION_END':
        if (!data.end_time) {
          throw new Error('End time is required for SESSION_END');
        }
        break;
      case 'INTERVIEW_START':
        if (!data.session_id) {
          throw new Error('Session ID is required for INTERVIEW_START');
        }
        break;
      case 'INTERVIEW_END':
        if (!data.end_time) {
          throw new Error('End time is required for INTERVIEW_END');
        }
        break;
      case 'INTERVIEW_RESULT':
        if (!data.result) {
          throw new Error('Result is required for INTERVIEW_RESULT');
        }
        break;
      // Add validations for other operation types as needed
    }
  }
  
  // Debounced sync to prevent multiple quick sync attempts
  private debouncedSync(delay: number = 2000): void {
    if (this.syncTimeoutId !== null) {
      window.clearTimeout(this.syncTimeoutId);
    }
    
    this.syncTimeoutId = window.setTimeout(() => {
      this.attemptSync();
      this.syncTimeoutId = null;
    }, delay);
  }
  
  // Attempt to process the sync queue
  async attemptSync(force: boolean = false): Promise<boolean> {
    // Don't start a new sync if one is already in progress
    if (this.syncInProgress && !force) {
      console.log('[SyncQueue] Sync already in progress');
      return false;
    }
    
    // Don't sync if offline
    if (!isOnline()) {
      console.log('[SyncQueue] Cannot sync while offline');
      this.notifyListeners({ type: 'OFFLINE' });
      return false;
    }
    
    // Cancel any pending sync timeout
    if (this.syncTimeoutId !== null) {
      window.clearTimeout(this.syncTimeoutId);
      this.syncTimeoutId = null;
    }
    
    try {
      this.syncInProgress = true;
      this.syncLockId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      this.lastSyncAttempt = new Date();
      
      this.notifyListeners({ 
        type: 'SYNC_STARTED', 
        timestamp: this.lastSyncAttempt.toISOString(),
        lockId: this.syncLockId
      });
      
      // Get operations that need processing, ordered by priority and creation time
      const pendingOperations = await syncQueueDB.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        console.log('[SyncQueue] No pending operations to sync');
        this.notifyListeners({ type: 'SYNC_COMPLETED', operationsProcessed: 0 });
        this.syncInProgress = false;
        this.syncLockId = null;
        return true;
      }
      
      console.log(`[SyncQueue] Processing ${pendingOperations.length} operations`);
      
      // Process operations in batches by type for efficiency
      // First sync sessions, then interviews
      const sessionOperations = pendingOperations.filter(op => op.entityType === 'session');
      const interviewOperations = pendingOperations.filter(op => op.entityType === 'interview');
      
      let successCount = 0;
      let failCount = 0;
      
      // Process sessions first
      if (sessionOperations.length > 0) {
        console.log(`[SyncQueue] Processing ${sessionOperations.length} session operations`);
        const sessionResults = await this.processBatch(sessionOperations);
        successCount += sessionResults.success;
        failCount += sessionResults.failed;
      }
      
      // Then process interviews
      if (interviewOperations.length > 0) {
        console.log(`[SyncQueue] Processing ${interviewOperations.length} interview operations`);
        const interviewResults = await this.processBatch(interviewOperations);
        successCount += interviewResults.success;
        failCount += interviewResults.failed;
      }
      
      console.log(`[SyncQueue] Sync completed: ${successCount} successful, ${failCount} failed`);
      
      this.notifyListeners({ 
        type: 'SYNC_COMPLETED', 
        operationsProcessed: successCount + failCount,
        successCount,
        failCount
      });
      
      return failCount === 0;
    } catch (error) {
      console.error('[SyncQueue] Error during sync:', error);
      this.notifyListeners({ 
        type: 'ERROR', 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    } finally {
      this.syncInProgress = false;
      this.syncLockId = null;
      
      // Schedule next sync attempt if there are still pending items
      const pendingCount = await syncQueueDB.getPendingCount();
        
      if (pendingCount > 0) {
        // Use exponential backoff for retries
        const baseDelay = 30000; // 30 seconds
        this.syncTimeoutId = window.setTimeout(() => {
          this.attemptSync();
        }, baseDelay);
        
        console.log(`[SyncQueue] Scheduled next sync attempt in ${baseDelay / 1000}s, ${pendingCount} operations pending`);
      }
    }
  }
  
  // Process a batch of operations of the same entity type
  private async processBatch(operations: SyncOperation[]): Promise<{success: number, failed: number}> {
    let success = 0;
    let failed = 0;
    
    for (const operation of operations) {
      try {
        // Mark as in progress
        await syncQueueDB.updateOperationStatus(operation.id, 'IN_PROGRESS', {
          attemptCount: operation.attemptCount + 1
        });
        
        // Log operation being processed
        console.log(`[SyncQueue] Processing operation ${operation.id}: ${operation.type} (attempt ${operation.attemptCount + 1})`);
        
        // Process based on entity type
        let operationSuccess = false;
        
        if (operation.entityType === 'session') {
          operationSuccess = await processSessionOperation(operation);
        } else if (operation.entityType === 'interview') {
          operationSuccess = await processInterviewOperation(operation);
        } else {
          console.warn(`[SyncQueue] Unknown entity type: ${operation.entityType}`);
        }
        
        if (operationSuccess) {
          // Mark as complete
          await syncQueueDB.updateOperationStatus(operation.id, 'COMPLETE');
          success++;
          console.log(`[SyncQueue] Operation ${operation.id} completed successfully`);
        } else {
          // Check if we've exceeded max retries
          if (operation.attemptCount >= MAX_RETRY_ATTEMPTS) {
            await syncQueueDB.updateOperationStatus(operation.id, 'ERROR', {
              lastError: 'Maximum retry attempts reached'
            });
            failed++;
            console.warn(`[SyncQueue] Operation ${operation.id} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
          } else {
            // Mark as failed for retry
            await syncQueueDB.updateOperationStatus(operation.id, 'FAILED');
            failed++;
            console.log(`[SyncQueue] Operation ${operation.id} failed, will retry later`);
          }
        }
      } catch (error) {
        console.error(`[SyncQueue] Error processing operation ${operation.id}:`, error);
        failed++;
        
        // Calculate backoff time based on attempt count
        const attemptIndex = Math.min(operation.attemptCount, RETRY_DELAYS.length - 1);
        const backoffTime = RETRY_DELAYS[attemptIndex];
        
        console.log(`[SyncQueue] Will retry operation ${operation.id} after ${backoffTime / 1000}s`);
        
        // Update with error info
        await syncQueueDB.updateOperationStatus(
          operation.id, 
          operation.attemptCount >= MAX_RETRY_ATTEMPTS ? 'ERROR' : 'FAILED',
          {
            lastError: error instanceof Error ? error.message : String(error),
            updatedAt: new Date().toISOString() // Force update to updatedAt for the backoff logic
          }
        );
      }
    }
    
    return { success, failed };
  }
  
  // Subscribe to sync events
  subscribe(listener: (status: SyncStatusUpdate) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // Notify all listeners
  private notifyListeners(status: SyncStatusUpdate): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SyncQueue] Error in listener:', error);
      }
    });
  }
  
  // Get pending operations count
  async getPendingCount(): Promise<number> {
    return await syncQueueDB.getPendingCount();
  }
  
  // Get sync status summary
  async getSyncStatus(): Promise<SyncStatusSummary> {
    const pendingCount = await syncQueueDB.getPendingCount();
    const failedOperations = await syncQueueDB.getOperationsByStatus('FAILED');
    const errorOperations = await syncQueueDB.getOperationsByStatus('ERROR');
    
    return {
      isOnline: isOnline(),
      pendingCount,
      failedCount: failedOperations.length,
      errorCount: errorOperations.length,
      lastSyncAttempt: this.lastSyncAttempt?.toISOString() || null,
      syncInProgress: this.syncInProgress,
      syncLockId: this.syncLockId
    };
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
    
    if (count > 0) {
      console.log(`[SyncQueue] Reset ${count} failed operations to pending`);
      this.notifyListeners({ type: 'OPERATIONS_RESET', count });
      
      // Attempt sync if we're online
      if (isOnline()) {
        this.debouncedSync(1000); // Short delay to let UI update
      }
    }
    
    return count;
  }
}

// Types for sync status updates
export type SyncStatusUpdate = 
  | { type: 'SYNC_STARTED', timestamp: string, lockId: string }
  | { type: 'SYNC_COMPLETED', operationsProcessed: number, successCount?: number, failCount?: number }
  | { type: 'OPERATION_QUEUED', operationId: string, operationType: SyncOperationType, entityType: string }
  | { type: 'ERROR', error: string }
  | { type: 'OFFLINE' }
  | { type: 'OPERATIONS_RESET', count: number };

// Type for sync status summary
export interface SyncStatusSummary {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  errorCount: number;
  lastSyncAttempt: string | null;
  syncInProgress: boolean;
  syncLockId: string | null;
}
