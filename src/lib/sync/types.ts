
import { v4 as uuidv4 } from 'uuid';

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

// Create a function to generate a new sync operation
export function createSyncOperation(
  type: SyncOperationType,
  data: any,
  options: {
    offlineId?: number | string | null,
    onlineId?: string | null,
    priority?: number,
    entityType: 'session' | 'interview'
  }
): SyncOperation {
  const now = new Date().toISOString();
  return {
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
}
