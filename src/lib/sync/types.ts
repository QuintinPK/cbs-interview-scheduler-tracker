
export type SyncOperationType = 
  | 'SESSION_START'
  | 'SESSION_END'
  | 'SESSION_UPDATE'
  | 'SESSION_DELETE'
  | 'INTERVIEW_START'
  | 'INTERVIEW_END'
  | 'INTERVIEW_UPDATE'
  | 'INTERVIEW_DELETE'
  | 'INTERVIEW_RESULT';

export type SyncOperationStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETE'
  | 'FAILED'
  | 'ERROR';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  status: SyncOperationStatus;
  priority: number;
  entityType: 'session' | 'interview';
  offlineId?: number | string | null;
  onlineId?: string | null;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  lastError?: string | null;
}

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
    id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    status: 'PENDING',
    priority: options.priority || 1,
    entityType: options.entityType,
    offlineId: options.offlineId || null,
    onlineId: options.onlineId || null,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
    lastError: null
  };
}
