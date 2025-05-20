
import Dexie from 'dexie';
import { SyncOperation, SyncOperationStatus } from './types';

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
  
  async getPendingOperations(): Promise<SyncOperation[]> {
    return await this.syncOperations
      .where('status')
      .anyOf('PENDING', 'FAILED')
      .sortBy(['priority', 'createdAt']);
  }
  
  async getPendingCount(): Promise<number> {
    return await this.syncOperations
      .where('status')
      .anyOf('PENDING', 'IN_PROGRESS', 'FAILED')
      .count();
  }
  
  async getOperationsByStatus(status: SyncOperationStatus | SyncOperationStatus[]): Promise<SyncOperation[]> {
    const statusArray = Array.isArray(status) ? status : [status];
    return await this.syncOperations
      .where('status')
      .anyOf(statusArray)
      .toArray();
  }
  
  async clearCompletedOperations(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISOString = cutoffDate.toISOString();
    
    return await this.syncOperations
      .where('status')
      .equals('COMPLETE')
      .and(op => op.updatedAt < cutoffISOString)
      .delete();
  }
  
  async updateOperationStatus(
    id: string, 
    status: SyncOperationStatus, 
    updates: Partial<SyncOperation> = {}
  ): Promise<void> {
    await this.syncOperations.update(id, {
      status,
      updatedAt: new Date().toISOString(),
      ...updates
    });
  }
  
  async addOperation(operation: SyncOperation): Promise<string> {
    return await this.syncOperations.add(operation);
  }
  
  async updateRelatedOperationsOnlineId(
    offlineId: number | string, 
    onlineId: string, 
    excludeOperationId?: string
  ): Promise<void> {
    await this.syncOperations
      .where('offlineId')
      .equals(offlineId)
      .and(op => excludeOperationId ? op.id !== excludeOperationId : true)
      .modify({ onlineId });
  }
}

// Create DB instance
export const syncQueueDB = new SyncQueueDatabase();
