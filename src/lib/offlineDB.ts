
import Dexie from 'dexie';

export function isOnline(): boolean {
  return navigator.onLine;
}

// Define the structure for location data
interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

// Interface for interviewers
interface Interviewer {
  id: string;
  code: string;
  name?: string;
}

// Interface for projects
interface Project {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
}

// Define the structure for interview save options
interface SaveInterviewOptions {
  sessionId: number;
  candidateName: string;
  projectId: string | null;
  startTime: string;
  location: LocationData | null;
  id?: number; // Optional ID for updates
}

// Define the structure for session save options
interface SaveSessionOptions {
  interviewerId: string;
  projectId: string | null;
  startTime: string;
  location: LocationData | null;
  id?: number; // Optional ID for updates
}

// Define the structure for session update options
interface UpdateSessionOptions {
  id: number;
  endTime: string;
  location?: LocationData | null;
}

// Define the structure for interview update options
interface UpdateInterviewOptions {
  id: number;
  endTime: string;
  location?: LocationData | null;
}

// Define the structure for interview result options
interface UpdateInterviewResultOptions {
  id: number;
  result: 'response' | 'non-response';
}

// Define the structure for sync log options
interface LogSyncOptions {
  syncType: string;
  status: string;
  message: string;
  timestamp?: string;
}

// Extend Dexie with our offline DB
class OfflineDB extends Dexie {
  sessions: Dexie.Table<any, number>;
  interviews: Dexie.Table<any, number>;
  syncLog: Dexie.Table<any, number>;
  interviewers: Dexie.Table<any, string>;
  projects: Dexie.Table<any, string>;

  constructor() {
    super('OfflineDB');
    this.version(1).stores({
      sessions: '++id, interviewerId, projectId, startTime, endTime, startLatitude, startLongitude, startAddress, endLatitude, endLongitude, endAddress, is_active',
      interviews: '++id, sessionId, candidateName, projectId, startTime, endTime, startLatitude, startLongitude, startAddress, endLatitude, endLongitude, endAddress, result',
      syncLog: '++id, syncType, status, message, timestamp',
      interviewers: 'id, code, name',
      projects: 'id, name, start_date, end_date'
    });
    this.sessions = this.table('sessions');
    this.interviews = this.table('interviews');
    this.syncLog = this.table('syncLog');
    this.interviewers = this.table('interviewers');
    this.projects = this.table('projects');
  }
}

const db = new OfflineDB();

// Function to save a session offline
export async function saveOfflineSession(
  interviewerId: string,
  projectId: string | null,
  startTime: string,
  location?: LocationData | null
): Promise<number> {
  try {
    const id = await db.sessions.add({
      interviewerId,
      projectId,
      startTime,
      startLatitude: location?.latitude || null,
      startLongitude: location?.longitude || null,
      startAddress: location?.address || null,
      endTime: null,
      endLatitude: null,
      endLongitude: null,
      endAddress: null,
      is_active: true
    });
    console.log('[OfflineDB] Saved session offline with ID:', id);
    return id;
  } catch (error) {
    console.error('[OfflineDB] Error saving session offline:', error);
    throw error;
  }
}

// Function to update a session offline
export async function updateOfflineSession(
  id: number,
  endTime: string,
  location?: LocationData | null
): Promise<void> {
  try {
    await db.sessions.update(id, {
      endTime,
      endLatitude: location?.latitude || null,
      endLongitude: location?.longitude || null,
      endAddress: location?.address || null,
      is_active: false
    });
    console.log('[OfflineDB] Updated session offline with ID:', id);
  } catch (error) {
    console.error('[OfflineDB] Error updating session offline:', error);
    throw error;
  }
}

// Function to save an interview offline
export async function saveOfflineInterview(options: SaveInterviewOptions): Promise<number> {
  try {
    const id = await db.interviews.add({
      sessionId: options.sessionId,
      candidateName: options.candidateName,
      projectId: options.projectId,
      startTime: options.startTime,
      startLatitude: options.location?.latitude || null,
      startLongitude: options.location?.longitude || null,
      startAddress: options.location?.address || null,
      endTime: null,
      endLatitude: null,
      endLongitude: null,
      endAddress: null,
      result: null
    });
    console.log('[OfflineDB] Saved interview offline with ID:', id);
    return id;
  } catch (error) {
    console.error('[OfflineDB] Error saving interview offline:', error);
    throw error;
  }
}

// Function to update an interview offline
export async function updateOfflineInterview(
  id: number,
  endTime: string,
  location?: LocationData | null
): Promise<void> {
  try {
    await db.interviews.update(id, {
      endTime,
      endLatitude: location?.latitude || null,
      endLongitude: location?.longitude || null,
      endAddress: location?.address || null
    });
    console.log('[OfflineDB] Updated interview offline with ID:', id);
  } catch (error) {
    console.error('[OfflineDB] Error updating interview offline:', error);
    throw error;
  }
}

// Function to update an interview result offline
export async function updateOfflineInterviewResult(id: number, result: 'response' | 'non-response'): Promise<void> {
  try {
    await db.interviews.update(id, {
      result: result
    });
    console.log('[OfflineDB] Updated interview result offline with ID:', id, 'Result:', result);
  } catch (error) {
    console.error('[OfflineDB] Error updating interview result offline:', error);
    throw error;
  }
}

// Function to get all sessions
export async function getAllOfflineSessions(): Promise<any[]> {
  try {
    const sessions = await db.sessions.toArray();
    console.log('[OfflineDB] Fetched all offline sessions');
    return sessions;
  } catch (error) {
    console.error('[OfflineDB] Error fetching all offline sessions:', error);
    return [];
  }
}

// Function to get all interviews
export async function getAllOfflineInterviews(): Promise<any[]> {
  try {
    const interviews = await db.interviews.toArray();
    console.log('[OfflineDB] Fetched all offline interviews');
    return interviews;
  } catch (error) {
    console.error('[OfflineDB] Error fetching all offline interviews:', error);
    return [];
  }
}

// Function to get sessions for a specific interviewer
export async function getSessionsForInterviewer(interviewerId: string): Promise<any[]> {
  try {
    const sessions = await db.sessions.where({ interviewerId: interviewerId }).toArray();
    console.log(`[OfflineDB] Fetched offline sessions for interviewer ${interviewerId}`);
    return sessions;
  } catch (error) {
    console.error(`[OfflineDB] Error fetching offline sessions for interviewer ${interviewerId}:`, error);
    return [];
  }
}

// Function to get interviews for a specific session
export async function getInterviewsForOfflineSession(sessionId: number): Promise<any[]> {
  try {
    const interviews = await db.interviews.where({ sessionId: sessionId }).toArray();
    console.log(`[OfflineDB] Fetched offline interviews for session ${sessionId}`);
    return interviews;
  } catch (error) {
    console.error(`[OfflineDB] Error fetching offline interviews for session ${sessionId}:`, error);
    return [];
  }
}

// Function to get a specific session by ID
export async function getOfflineSession(id: number): Promise<any> {
  try {
    const session = await db.sessions.get(id);
    console.log(`[OfflineDB] Fetched offline session with ID ${id}`);
    return session;
  } catch (error) {
    console.error(`[OfflineDB] Error fetching offline session with ID ${id}:`, error);
    return null;
  }
}

// Function to get a specific interview by ID
export async function getOfflineInterview(id: number): Promise<any> {
  try {
    const interview = await db.interviews.get(id);
    console.log(`[OfflineDB] Fetched offline interview with ID ${id}`);
    return interview;
  } catch (error) {
    console.error(`[OfflineDB] Error fetching offline interview with ID ${id}:`, error);
    return null;
  }
}

// Function to get unsynced sessions count
export async function getUnsyncedSessionsCount(): Promise<number> {
  try {
    const count = await db.sessions.where('is_active').equals(true).count();
    return count;
  } catch (error) {
    console.error('[OfflineDB] Error getting unsynced sessions count:', error);
    return 0;
  }
}

// Function to get unsynced interviews count
export async function getUnsyncedInterviewsCount(): Promise<number> {
  try {
    const count = await db.interviews.where('result').equals(null).count();
    return count;
  } catch (error) {
    console.error('[OfflineDB] Error getting unsynced interviews count:', error);
    return 0;
  }
}

// Function to cache an interviewer for offline use
export async function cacheInterviewer(code: string): Promise<boolean> {
  try {
    // Check if we're online to fetch from Supabase
    if (isOnline()) {
      // Here you would normally fetch from Supabase
      // For now, just create a mock interviewer
      const interviewer = {
        id: `offline-${code}`,
        code: code,
        name: `Interviewer ${code}`
      };
      
      // Save to IndexedDB
      await db.interviewers.put(interviewer);
      console.log(`[OfflineDB] Cached interviewer with code ${code}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[OfflineDB] Error caching interviewer with code ${code}:`, error);
    return false;
  }
}

// Function to get an interviewer by code
export async function getInterviewerByCode(code: string): Promise<Interviewer | null> {
  try {
    // First try to get from local cache
    const interviewer = await db.interviewers.where('code').equals(code).first();
    
    if (interviewer) {
      console.log(`[OfflineDB] Found interviewer with code ${code} in cache`);
      return interviewer;
    }
    
    // If not found in cache and online, would normally fetch from Supabase
    if (isOnline()) {
      // Mock response for now
      const mockInterviewer = {
        id: `online-${code}`,
        code: code,
        name: `Interviewer ${code}`
      };
      
      // Cache for future offline use
      await cacheInterviewer(code);
      
      return mockInterviewer;
    }
    
    console.log(`[OfflineDB] No interviewer found with code ${code}`);
    return null;
  } catch (error) {
    console.error(`[OfflineDB] Error getting interviewer with code ${code}:`, error);
    return null;
  }
}

// Function to cache projects for offline use
export async function cacheProjects(projects: Project[]): Promise<boolean> {
  try {
    // Add all projects to IndexedDB
    for (const project of projects) {
      await db.projects.put(project);
    }
    console.log(`[OfflineDB] Cached ${projects.length} projects`);
    return true;
  } catch (error) {
    console.error('[OfflineDB] Error caching projects:', error);
    return false;
  }
}

// Function to get cached projects
export async function getCachedProjects(): Promise<Project[]> {
  try {
    const projects = await db.projects.toArray();
    console.log(`[OfflineDB] Retrieved ${projects.length} cached projects`);
    return projects;
  } catch (error) {
    console.error('[OfflineDB] Error getting cached projects:', error);
    return [];
  }
}

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
    const sessionsUnsynced = await db.sessions.where('is_active').equals(true).count();
    const sessionsInProgress = await db.sessions
      .filter(session => session.endTime !== null && !session.is_active)
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
