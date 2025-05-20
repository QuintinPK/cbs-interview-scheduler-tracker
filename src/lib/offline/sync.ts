
import { db, isOnline } from './db';
import { getAllOfflineSessions } from './sessions';
import { getAllOfflineInterviews } from './interviews';

// Function to synchronize offline sessions
export async function syncOfflineSessions(): Promise<boolean> {
  try {
    const allSessions = await getAllOfflineSessions();
    console.log(`[OfflineDB] Found ${allSessions.length} offline sessions to sync`);

    // In a real implementation, you would sync with Supabase here
    // For now, just log that we're syncing
    
    const allInterviews = await getAllOfflineInterviews();
    console.log(`[OfflineDB] Found ${allInterviews.length} offline interviews to sync`);

    // Mock successful sync
    return true;
  } catch (error) {
    console.error('[OfflineDB] Error during offline session synchronization:', error);
    return false;
  }
}

// Function to acquire a sync lock
export async function acquireSyncLock(lockedBy: string): Promise<boolean> {
  try {
    // Check if a lock already exists and is still valid (expiresAt > now)
    const existingLock = await getActiveSyncLock();
    if (existingLock) {
      console.warn('[OfflineDB] Sync lock already exists:', existingLock);
      return false;
    }

    // Calculate the expiration time (e.g., 5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Add the new lock to the syncLog table
    const id = await db.syncLog.add({
      syncType: 'SyncLock',
      status: 'Acquired',
      message: `Sync lock acquired by ${lockedBy}`,
      timestamp: new Date().toISOString(),
      lockedBy: lockedBy,
      expiresAt: expiresAt,
      isLocked: 1
    });

    console.log(`[OfflineDB] Acquired sync lock with ID ${id}, expires at ${expiresAt}`);
    return true;
  } catch (error) {
    console.error('[OfflineDB] Error acquiring sync lock:', error);
    return false;
  }
}

// Function to release a sync lock
export async function releaseSyncLock(lockedBy: string): Promise<boolean> {
  try {
    // Get the active sync lock
    const activeLock = await getActiveSyncLock();

    if (!activeLock) {
      console.warn('[OfflineDB] No active sync lock found to release');
      return false;
    }

    // Check if the lock was acquired by the same instance
    if (activeLock.lockedBy !== lockedBy) {
      console.warn(`[OfflineDB] Cannot release lock acquired by another instance (${activeLock.lockedBy})`);
      return false;
    }

    // Update the lock status to released
    await db.syncLog.update(activeLock.id, {
      status: 'Released',
      message: `Sync lock released by ${lockedBy}`,
      timestamp: new Date().toISOString(),
      isLocked: 0
    });

    console.log(`[OfflineDB] Released sync lock with ID ${activeLock.id}`);
    return true;
  } catch (error) {
    console.error('[OfflineDB] Error releasing sync lock:', error);
    return false;
  }
}

// Function to get the active sync lock
export async function getActiveSyncLock(): Promise<any | null> {
  try {
    // Get all sync locks
    const syncLocks = await db.syncLog
      .where('syncType')
      .equals('SyncLock')
      .toArray();

    // Find the latest lock that is still active (expiresAt > now)
    const now = new Date().toISOString();
    const activeLock = syncLocks
      .filter(lock => lock.isLocked === 1 && lock.expiresAt > now)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return activeLock || null;
  } catch (error) {
    console.error('[OfflineDB] Error getting active sync lock:', error);
    return null;
  }
}

// Function to log sync operations
export async function logSync(syncType: string, status: string, message: string, syncStatus?: string): Promise<number> {
  try {
    const id = await db.syncLog.add({
      syncType: syncType,
      status: status,
      syncStatus: syncStatus || "unknown",
      message: message,
      timestamp: new Date().toISOString()
    });
    console.log(`[OfflineDB] Logged sync operation with ID ${id}: ${syncType} - ${status} - ${message}`);
    return id;
  } catch (error) {
    console.error('[OfflineDB] Error logging sync operation:', error);
    return -1;
  }
}

// Function to get sync status
export async function getSyncStatus(): Promise<any> {
  try {
    // Get counts for sessions
    const sessionsTotal = await db.sessions.count();
    // Using 1 as a truthy value instead of a boolean
    const sessionsUnsynced = await db.sessions.where('is_active').equals(1).count();
    const sessionsInProgress = await db.sessions
      .filter(session => session.endTime !== null && session.is_active !== 1)
      .count();

    // Get counts for interviews
    const interviewsTotal = await db.interviews.count();
    const interviewsUnsynced = await db.interviews.where('result').equals(null).count();
    const interviewsInProgress = await db.interviews
      .filter(interview => interview.endTime !== null && interview.result === null)
      .count();

    // Get last sync time
    const lastSyncEntry = await db.syncLog
      .where('syncType')
      .notEqual('SyncLock')
      .reverse()
      .first();

    const lastSync = lastSyncEntry ? lastSyncEntry.timestamp : null;

    // Get current lock
    const currentLock = await getActiveSyncLock();

    const status = {
      sessionsTotal,
      sessionsUnsynced,
      sessionsInProgress,
      interviewsTotal,
      interviewsUnsynced,
      interviewsInProgress,
      lastSync,
      currentLock
    };

    console.log('[OfflineDB] Retrieved sync status:', status);
    return status;
  } catch (error) {
    console.error('[OfflineDB] Error retrieving sync status:', error);
    return {};
  }
}
