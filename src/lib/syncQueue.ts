import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { isOnline } from './offlineDB';

// Define sync operation types
export type SyncOperationType = 
  | 'SESSION_START'
  | 'SESSION_END'
  | 'INTERVIEW_START'
  | 'INTERVIEW_END'
  | 'INTERVIEW_RESULT'
  | 'SESSION_UPDATE'
  | 'INTERVIEW_UPDATE';

// Define sync operation status
export type SyncOperationStatus = 
  | 'PENDING' // Not yet attempted
  | 'IN_PROGRESS' // Currently being processed
  | 'FAILED' // Failed but will be retried
  | 'COMPLETE' // Successfully completed
  | 'ERROR'; // Terminal error, won't be retried

// Define sync operation
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  offlineId: number | string | null;
  onlineId: string | null;
  status: SyncOperationStatus;
  priority: number;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  lastError: string | null;
  entityType: 'session' | 'interview';
}

// Extend Dexie with our sync queue
class SyncQueueDatabase extends Dexie {
  syncOperations: Dexie.Table<SyncOperation, string>;

  constructor() {
    super('SyncQueueDB');
    this.version(1).stores({
      syncOperations: 'id, type, status, priority, entityType, offlineId, onlineId, createdAt'
    });
    this.syncOperations = this.table('syncOperations');
  }
}

// Create DB instance
const syncQueueDB = new SyncQueueDatabase();

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
    const now = new Date().toISOString();
    const operation: SyncOperation = {
      id: uuidv4(),
      type,
      data,
      offlineId: options.offlineId || null,
      onlineId: options.onlineId || null,
      status: 'PENDING',
      priority: options.priority || 1, // Default priority
      createdAt: now,
      updatedAt: now,
      attemptCount: 0,
      lastError: null,
      entityType: options.entityType
    };
    
    // Store in IndexedDB
    await syncQueueDB.syncOperations.add(operation);
    
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
      const pendingOperations = await syncQueueDB.syncOperations
        .where('status')
        .anyOf(['PENDING', 'FAILED'])
        .sortBy(['priority', 'createdAt']);
      
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
      const pendingCount = await syncQueueDB.syncOperations
        .where('status')
        .anyOf(['PENDING', 'FAILED'])
        .count();
        
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
        await syncQueueDB.syncOperations.update(operation.id, {
          status: 'IN_PROGRESS',
          attemptCount: operation.attemptCount + 1,
          updatedAt: new Date().toISOString()
        });
        
        // Process based on operation type
        let success = false;
        
        switch (operation.type) {
          case 'SESSION_START':
            success = await this.syncSessionStart(operation);
            break;
          case 'SESSION_END':
            success = await this.syncSessionEnd(operation);
            break;
          case 'INTERVIEW_START':
            success = await this.syncInterviewStart(operation);
            break;
          case 'INTERVIEW_END':
            success = await this.syncInterviewEnd(operation);
            break;
          case 'INTERVIEW_RESULT':
            success = await this.syncInterviewResult(operation);
            break;
          default:
            console.warn(`[SyncQueue] Unknown operation type: ${operation.type}`);
            success = false;
        }
        
        if (success) {
          // Mark as complete
          await syncQueueDB.syncOperations.update(operation.id, {
            status: 'COMPLETE',
            updatedAt: new Date().toISOString()
          });
        } else {
          // Check if we've exceeded max retries
          if (operation.attemptCount >= MAX_RETRY_ATTEMPTS) {
            await syncQueueDB.syncOperations.update(operation.id, {
              status: 'ERROR',
              updatedAt: new Date().toISOString(),
              lastError: 'Maximum retry attempts reached'
            });
          } else {
            // Mark as failed for retry
            await syncQueueDB.syncOperations.update(operation.id, {
              status: 'FAILED',
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`[SyncQueue] Error processing operation ${operation.id}:`, error);
        
        // Update with error info
        await syncQueueDB.syncOperations.update(operation.id, {
          status: operation.attemptCount >= MAX_RETRY_ATTEMPTS ? 'ERROR' : 'FAILED',
          lastError: error instanceof Error ? error.message : String(error),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }
  
  // Sync a session start operation
  private async syncSessionStart(operation: SyncOperation): Promise<boolean> {
    const { interviewer_id, project_id, start_time, start_latitude, start_longitude, start_address } = operation.data;
    
    // First check if this session was already synced (prevent duplicates)
    if (operation.onlineId) {
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', operation.onlineId)
        .single();
        
      if (existingSession) {
        console.log(`[SyncQueue] Session ${operation.onlineId} already exists, marking as completed`);
        return true;
      }
    }
    
    // Insert new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert([{
        interviewer_id,
        project_id,
        start_time,
        start_latitude: start_latitude || null,
        start_longitude: start_longitude || null,
        start_address: start_address || null,
        is_active: true
      }])
      .select()
      .single();
      
    if (error) {
      console.error('[SyncQueue] Error creating session:', error);
      return false;
    }
    
    console.log(`[SyncQueue] Created session ${session.id} from offline ID ${operation.offlineId}`);
    
    // Update the operation with the online ID
    await syncQueueDB.syncOperations.update(operation.id, {
      onlineId: session.id
    });
    
    // Update all related operations with the same offline ID
    if (operation.offlineId) {
      await syncQueueDB.syncOperations
        .where('offlineId')
        .equals(operation.offlineId)
        .and(op => op.id !== operation.id)
        .modify({ onlineId: session.id });
    }
    
    return true;
  }
  
  // Sync a session end operation
  private async syncSessionEnd(operation: SyncOperation): Promise<boolean> {
    const { end_time, end_latitude, end_longitude, end_address } = operation.data;
    const sessionId = operation.onlineId;
    
    if (!sessionId) {
      console.error('[SyncQueue] Cannot end session without online ID');
      return false;
    }
    
    // Update the session
    const { error } = await supabase
      .from('sessions')
      .update({
        end_time,
        end_latitude: end_latitude || null,
        end_longitude: end_longitude || null,
        end_address: end_address || null,
        is_active: false
      })
      .eq('id', sessionId);
      
    if (error) {
      console.error('[SyncQueue] Error ending session:', error);
      return false;
    }
    
    return true;
  }
  
  // Sync an interview start operation
  private async syncInterviewStart(operation: SyncOperation): Promise<boolean> {
    const { 
      session_id, 
      project_id, 
      candidate_name, 
      start_time, 
      start_latitude, 
      start_longitude, 
      start_address 
    } = operation.data;
    
    if (!session_id) {
      console.error('[SyncQueue] Cannot start interview without session ID');
      return false;
    }
    
    // First check if interview already exists
    if (operation.onlineId) {
      const { data: existingInterview } = await supabase
        .from('interviews')
        .select('id')
        .eq('id', operation.onlineId)
        .single();
        
      if (existingInterview) {
        console.log(`[SyncQueue] Interview ${operation.onlineId} already exists, marking as completed`);
        return true;
      }
    }
    
    // Insert new interview
    const { data: interview, error } = await supabase
      .from('interviews')
      .insert([{
        session_id,
        project_id,
        candidate_name: candidate_name || 'New interview',
        start_time,
        start_latitude: start_latitude || null,
        start_longitude: start_longitude || null,
        start_address: start_address || null,
        is_active: true
      }])
      .select()
      .single();
      
    if (error) {
      console.error('[SyncQueue] Error creating interview:', error);
      return false;
    }
    
    console.log(`[SyncQueue] Created interview ${interview.id} from offline ID ${operation.offlineId}`);
    
    // Update the operation with the online ID
    await syncQueueDB.syncOperations.update(operation.id, {
      onlineId: interview.id
    });
    
    // Update all related operations with the same offline ID
    if (operation.offlineId) {
      await syncQueueDB.syncOperations
        .where('offlineId')
        .equals(operation.offlineId)
        .and(op => op.id !== operation.id)
        .modify({ onlineId: interview.id });
    }
    
    return true;
  }
  
  // Sync an interview end operation
  private async syncInterviewEnd(operation: SyncOperation): Promise<boolean> {
    const { end_time, end_latitude, end_longitude, end_address } = operation.data;
    const interviewId = operation.onlineId;
    
    if (!interviewId) {
      console.error('[SyncQueue] Cannot end interview without online ID');
      return false;
    }
    
    // Update the interview
    const { error } = await supabase
      .from('interviews')
      .update({
        end_time,
        end_latitude: end_latitude || null,
        end_longitude: end_longitude || null,
        end_address: end_address || null
      })
      .eq('id', interviewId);
      
    if (error) {
      console.error('[SyncQueue] Error ending interview:', error);
      return false;
    }
    
    return true;
  }
  
  // Sync an interview result operation
  private async syncInterviewResult(operation: SyncOperation): Promise<boolean> {
    const { result } = operation.data;
    const interviewId = operation.onlineId;
    
    if (!interviewId) {
      console.error('[SyncQueue] Cannot set interview result without online ID');
      return false;
    }
    
    // Update the interview
    const { error } = await supabase
      .from('interviews')
      .update({
        result,
        is_active: false
      })
      .eq('id', interviewId);
      
    if (error) {
      console.error('[SyncQueue] Error setting interview result:', error);
      return false;
    }
    
    return true;
  }
  
  // Get pending operations count
  async getPendingCount(): Promise<number> {
    return await syncQueueDB.syncOperations
      .where('status')
      .anyOf(['PENDING', 'IN_PROGRESS', 'FAILED'])
      .count();
  }
  
  // Get all operations with a specific status
  async getOperationsByStatus(status: SyncOperationStatus | SyncOperationStatus[]): Promise<SyncOperation[]> {
    const statusArray = Array.isArray(status) ? status : [status];
    return await syncQueueDB.syncOperations
      .where('status')
      .anyOf(...statusArray)
      .toArray();
  }
  
  // Clear completed operations older than specified days
  async clearCompletedOperations(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISOString = cutoffDate.toISOString();
    
    return await syncQueueDB.syncOperations
      .where('status')
      .equals('COMPLETE')
      .and(op => op.updatedAt < cutoffISOString)
      .delete();
  }
  
  // Reset failed operations to pending
  async resetFailedOperations(): Promise<number> {
    const operations = await syncQueueDB.syncOperations
      .where('status')
      .equals('FAILED')
      .toArray();
    
    let count = 0;
    for (const operation of operations) {
      await syncQueueDB.syncOperations.update(operation.id, {
        status: 'PENDING',
        updatedAt: new Date().toISOString()
      });
      count++;
    }
    
    return count;
  }
}

// Export singleton instance
export const syncQueue = new SyncQueueManager();

// Export database for direct access if needed
export { syncQueueDB };

// Helper function to initialize sync queue when the app starts
export async function initializeSyncQueue(): Promise<void> {
  // Check for and clean up any operations stuck in "IN_PROGRESS" state (e.g., after app crash)
  const stuckOperations = await syncQueueDB.syncOperations
    .where('status')
    .equals('IN_PROGRESS')
    .toArray();
    
  if (stuckOperations.length > 0) {
    console.log(`[SyncQueue] Found ${stuckOperations.length} stuck operations, resetting to PENDING`);
    
    for (const operation of stuckOperations) {
      await syncQueueDB.syncOperations.update(operation.id, {
        status: 'PENDING',
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  // Clean up old completed operations
  await syncQueue.clearCompletedOperations();
  
  // If we're online, attempt to process any pending operations
  if (isOnline()) {
    syncQueue.attemptSync();
  }
}
