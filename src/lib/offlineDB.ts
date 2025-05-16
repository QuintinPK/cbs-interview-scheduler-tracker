import Dexie, { Table } from 'dexie';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Location } from '@/types';
import { getCurrentLocation, getAddressFromCoordinates } from "@/lib/utils";

// Define the structure for our offline interviewers
export interface OfflineInterviewer {
  id?: number;
  code: string;
  supabaseId: string | null;
}

// Define the structure for our offline sessions
export interface OfflineSession {
  id?: number;
  interviewerCode: string;
  startTime: string;
  endTime: string | null;
  startLatitude: number | null;
  startLongitude: number | null;
  startAddress: string | null;
  endLatitude: number | null;
  endLongitude: number | null;
  endAddress: string | null;
  projectId: string | null;
  synced: number; // 0 = false, 1 = true
  supabaseId: string | null; // To store the ID from Supabase after sync
  syncing: number; // 0 = false, 1 = true, new field to track sync in progress
  syncAttempts: number; // Track number of sync attempts
  uniqueKey: string; // New field to ensure uniqueness
  lastSyncAttempt: string | null; // Timestamp of last sync attempt
  syncError: string | null; // Store error messages from sync attempts
  syncPriority: number; // Higher numbers get synced first (useful for retries)
}

// Define the structure for our offline interviews
export interface OfflineInterview {
  id?: number;
  sessionId: number; // Local Dexie session ID
  supabaseSessionId: string | null; // Supabase session ID (will be null until session is synced)
  candidateName: string;
  startTime: string;
  endTime: string | null;
  startLatitude: number | null;
  startLongitude: number | null;
  startAddress: string | null;
  endLatitude: number | null;
  endLongitude: number | null;
  endAddress: string | null;
  projectId: string | null;
  result: string | null; // 'response' | 'non-response' | null
  synced: number; // 0 = false, 1 = true
  syncing: number; // 0 = false, 1 = true (new field)
  syncAttempts: number; // Track number of sync attempts (new field)
  lastSyncAttempt: string | null; // Timestamp of last sync attempt (new field)
  syncError: string | null; // Store error messages from sync attempts (new field)
}

// Define the structure for our offline projects
export interface OfflineProject {
  id: string;
  name: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
  start_date?: string; // Added to match Project type
  end_date?: string;   // Added to match Project type
}

// Define a structure for sync lock
interface SyncLock {
  id: 1; // We'll only ever have one lock record
  isLocked: number; // 0 = false, 1 = true
  lockedAt: string | null;
  lockedBy: string | null;
  expiresAt: string | null;
}

// Define a structure for sync logs
interface SyncLog {
  id?: number;
  timestamp: string;
  action: string;
  status: string; // 'success', 'error', 'warning'
  details: string;
  sessionId?: number;
  interviewId?: number;
}

// Create a Dexie database class
class OfflineDatabase extends Dexie {
  interviewers!: Table<OfflineInterviewer>;
  sessions!: Table<OfflineSession>;
  interviews!: Table<OfflineInterview>;
  projects!: Table<OfflineProject>;
  syncLock!: Table<SyncLock>;
  syncLogs!: Table<SyncLog>; // New table for sync logs

  constructor() {
    super('offlineSessionsDB');
    
    // Update the database schema to include all tables we need
    this.version(5).stores({
      interviewers: '++id, code',
      sessions: '++id, interviewerCode, startTime, synced, supabaseId, uniqueKey, syncing, syncPriority',
      interviews: '++id, sessionId, startTime, endTime, synced, supabaseSessionId, syncing',
      projects: 'id, name',
      syncLock: 'id, isLocked, lockedAt',
      syncLogs: '++id, timestamp, action, status, sessionId, interviewId'
    });
  }
}

// Create a singleton instance
export const offlineDB = new OfflineDatabase();

// Initialize sync lock if it doesn't exist
(async () => {
  try {
    const lockExists = await offlineDB.syncLock.get(1);
    if (!lockExists) {
      await offlineDB.syncLock.add({
        id: 1,
        isLocked: 0,
        lockedAt: null,
        lockedBy: null,
        expiresAt: null
      });
      console.log("Sync lock initialized");
    }
    
    // Log database initialization
    logSync('System', 'OfflineDB initialized', 'success', 'Application started');
  } catch (error) {
    console.error("Error initializing sync lock:", error);
    logSync('System', 'OfflineDB initialization error', 'error', String(error));
  }
})();

// Helper function to log sync activities
export const logSync = async (action: string, status: string, type: 'success' | 'error' | 'warning', details: string, sessionId?: number, interviewId?: number) => {
  try {
    await offlineDB.syncLogs.add({
      timestamp: new Date().toISOString(),
      action,
      status,
      details,
      sessionId,
      interviewId
    });
  } catch (err) {
    console.error("Error logging sync activity:", err);
  }
};

// Check if a network connection is available
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Clear expired locks automatically
const clearExpiredLocks = async () => {
  try {
    const lock = await offlineDB.syncLock.get(1);
    if (lock && lock.isLocked === 1 && lock.expiresAt) {
      if (new Date(lock.expiresAt) < new Date()) {
        console.log("Found expired lock, clearing...");
        await offlineDB.syncLock.update(1, {
          isLocked: 0,
          lockedAt: null,
          lockedBy: null,
          expiresAt: null
        });
        logSync('ClearExpiredLock', 'Lock cleared', 'warning', `Expired lock by ${lock.lockedBy} was cleared`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error clearing expired locks:", error);
    return false;
  }
};

// Acquire a sync lock with a timeout mechanism and automatic clearing of expired locks
export const acquireSyncLock = async (lockId: string, timeoutMs: number = 30000): Promise<boolean> => {
  try {
    // First check if there are any expired locks
    await clearExpiredLocks();
    
    // Check if the lock is already acquired
    const lock = await offlineDB.syncLock.get(1);
    if (!lock) {
      console.error("Sync lock record not found");
      logSync('AcquireLock', 'Lock record missing', 'error', `Lock record not found for ${lockId}`);
      return false;
    }
    
    // If the lock is already locked, check if it's by us
    if (lock.isLocked === 1) {
      if (lock.lockedBy === lockId) {
        // We already hold the lock, extend it
        const now = new Date();
        const expires = new Date(now.getTime() + timeoutMs);
        
        await offlineDB.syncLock.update(1, {
          lockedAt: now.toISOString(),
          expiresAt: expires.toISOString()
        });
        
        logSync('AcquireLock', 'Lock extended', 'success', `Lock extended by ${lockId}`);
        console.log("Sync lock extended by:", lockId);
        return true;
      }
      
      // Someone else has the lock
      logSync('AcquireLock', 'Lock acquisition failed', 'warning', `Lock already held by ${lock.lockedBy}, requested by ${lockId}`);
      console.log("Sync already in progress by:", lock.lockedBy);
      return false;
    }
    
    // Try to acquire the lock
    const now = new Date();
    const expires = new Date(now.getTime() + timeoutMs);
    
    await offlineDB.syncLock.update(1, {
      isLocked: 1,
      lockedAt: now.toISOString(),
      lockedBy: lockId,
      expiresAt: expires.toISOString()
    });
    
    logSync('AcquireLock', 'Lock acquired', 'success', `Lock acquired by ${lockId}`);
    console.log("Sync lock acquired by:", lockId);
    return true;
  } catch (error) {
    console.error("Error acquiring sync lock:", error);
    logSync('AcquireLock', 'Lock error', 'error', `Error acquiring lock by ${lockId}: ${error}`);
    return false;
  }
};

// Release a sync lock
export const releaseSyncLock = async (lockId: string): Promise<boolean> => {
  try {
    const lock = await offlineDB.syncLock.get(1);
    if (!lock) {
      console.error("Sync lock record not found");
      return false;
    }
    
    // Only release the lock if it's owned by the requesting ID
    if (lock.isLocked === 1) {
      // Allow force release if the lock has expired
      const isExpired = lock.expiresAt && new Date(lock.expiresAt) < new Date();
      
      if (lock.lockedBy === lockId || isExpired) {
        await offlineDB.syncLock.update(1, {
          isLocked: 0,
          lockedAt: null,
          lockedBy: null,
          expiresAt: null
        });
        
        if (isExpired) {
          logSync('ReleaseLock', 'Forced lock release', 'warning', `Expired lock by ${lock.lockedBy} force-released by ${lockId}`);
          console.log("Expired sync lock force released by:", lockId);
        } else {
          logSync('ReleaseLock', 'Lock released', 'success', `Lock released by ${lockId}`);
          console.log("Sync lock released by:", lockId);
        }
        
        return true;
      } else {
        logSync('ReleaseLock', 'Lock release denied', 'warning', `${lockId} tried to release lock owned by ${lock.lockedBy}`);
        console.log("Cannot release lock - not owned by:", lockId);
        return false;
      }
    } else {
      // Lock is already released
      return true;
    }
  } catch (error) {
    console.error("Error releasing sync lock:", error);
    logSync('ReleaseLock', 'Lock release error', 'error', `Error releasing lock by ${lockId}: ${error}`);
    return false;
  }
};

// Cache interviewer when they login
export const cacheInterviewer = async (code: string): Promise<void> => {
  try {
    // Check if interviewer is already cached
    const existingInterviewer = await offlineDB.interviewers
      .where('code')
      .equals(code)
      .first();
      
    if (existingInterviewer) {
      console.log("Interviewer already cached:", existingInterviewer);
      return;
    }
    
    // Only fetch from Supabase if online
    if (isOnline()) {
      const { data, error } = await supabase
        .from('interviewers')
        .select('id, code')
        .eq('code', code)
        .single();
        
      if (error || !data) {
        console.log("Error fetching interviewer data, skipping cache:", error);
        return;
      }
      
      await offlineDB.interviewers.add({
        code: data.code,
        supabaseId: data.id
      });
      
      logSync('CacheInterviewer', 'Interviewer cached', 'success', `Cached interviewer ${data.code}`);
      console.log("Interviewer cached for offline use:", data.code);
    }
  } catch (error) {
    console.error("Error caching interviewer:", error);
    logSync('CacheInterviewer', 'Cache error', 'error', `Error caching interviewer ${code}: ${error}`);
  }
};

// Cache projects when they are loaded
export const cacheProjects = async (projects: any[]): Promise<void> => {
  try {
    if (!projects || projects.length === 0) return;
    
    for (const project of projects) {
      // Check if project is already cached
      const existingProject = await offlineDB.projects
        .where('id')
        .equals(project.id)
        .first();
        
      if (!existingProject) {
        await offlineDB.projects.add({
          id: project.id,
          name: project.name,
          excluded_islands: project.excluded_islands,
          start_date: project.start_date,
          end_date: project.end_date
        });
      }
    }
    
    logSync('CacheProjects', 'Projects cached', 'success', `Cached ${projects.length} projects`);
    console.log(`${projects.length} projects cached for offline use`);
  } catch (error) {
    console.error("Error caching projects:", error);
    logSync('CacheProjects', 'Cache error', 'error', `Error caching projects: ${error}`);
  }
};

// Get interviewer by code (from cache or Supabase)
export const getInterviewerByCode = async (code: string): Promise<{ id: string; code: string } | null> => {
  try {
    // First try the offline database
    const cachedInterviewer = await offlineDB.interviewers
      .where('code')
      .equals(code)
      .first();
      
    if (cachedInterviewer) {
      console.log("Found interviewer in cache:", cachedInterviewer);
      return {
        id: cachedInterviewer.supabaseId || `offline-${cachedInterviewer.id}`,
        code: cachedInterviewer.code
      };
    }
    
    // If online, try Supabase
    if (isOnline()) {
      const { data, error } = await supabase
        .from('interviewers')
        .select('id, code')
        .eq('code', code)
        .single();
        
      if (error || !data) {
        console.error("Interviewer not found:", error);
        return null;
      }
      
      // Cache for future offline use
      await cacheInterviewer(code);
      
      return {
        id: data.id,
        code: data.code
      };
    }
    
    console.log("Interviewer not found in offline cache and user is offline");
    return null;
  } catch (error) {
    console.error("Error getting interviewer by code:", error);
    logSync('GetInterviewer', 'Error', 'error', `Error getting interviewer ${code}: ${error}`);
    return null;
  }
};

// Get cached projects
export const getCachedProjects = async (): Promise<OfflineProject[]> => {
  try {
    const projects = await offlineDB.projects.toArray();
    return projects;
  } catch (error) {
    console.error("Error getting cached projects:", error);
    logSync('GetProjects', 'Error', 'error', `Error getting cached projects: ${error}`);
    return [];
  }
};

// Generate a unique key for session
const generateSessionUniqueKey = (interviewerCode: string, startTime: string, projectId: string | null): string => {
  return `${interviewerCode}_${startTime}_${projectId || 'null'}`;
};

// Save a session to the offline database
export const saveOfflineSession = async (
  interviewerCode: string, 
  projectId: string | null, 
  startTime: string, 
  startLocation?: Location
): Promise<number> => {
  try {
    // Generate a unique key to prevent duplicates
    const uniqueKey = generateSessionUniqueKey(interviewerCode, startTime, projectId);

    // Check if a session with this key already exists
    const existingSession = await offlineDB.sessions
      .where('uniqueKey')
      .equals(uniqueKey)
      .first();

    if (existingSession) {
      logSync('SaveSession', 'Session exists', 'warning', `Session with identical keys already exists: ${uniqueKey}`, existingSession.id);
      console.log("Session with identical keys already exists, returning existing ID:", existingSession.id);
      return existingSession.id as number;
    }
    
    const id = await offlineDB.sessions.add({
      interviewerCode,
      projectId,
      startTime,
      startLatitude: startLocation?.latitude || null,
      startLongitude: startLocation?.longitude || null,
      startAddress: startLocation?.address || null,
      endTime: null,
      endLatitude: null,
      endLongitude: null,
      endAddress: null,
      synced: 0,
      supabaseId: null,
      syncing: 0,
      syncAttempts: 0,
      uniqueKey,
      lastSyncAttempt: null,
      syncError: null,
      syncPriority: 10 // Default priority
    });
    
    logSync('SaveSession', 'Session saved', 'success', `New offline session saved with ID: ${id}`, id);
    console.log("Session saved locally:", id);
    
    // Try to register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is available
        if (registration.sync) {
          // Use a debounced sync request
          await registration.sync.register('sync-sessions');
        } else {
          console.log('Background sync not available');
        }
      } catch (err) {
        console.error('Background sync registration failed:', err);
      }
    }
    
    return id;
  } catch (error) {
    console.error("Error saving offline session:", error);
    logSync('SaveSession', 'Error', 'error', `Error saving offline session: ${error}`);
    throw error;
  }
};

// Update an offline session with end details
export const updateOfflineSession = async (
  id: number, 
  endTime: string, 
  endLocation?: Location
): Promise<void> => {
  try {
    console.log("Updating offline session with end location:", endLocation);
    
    // If no location provided, try to get it
    let locationToUse = endLocation;
    if (!locationToUse) {
      try {
        locationToUse = await getCurrentLocation({ highAccuracy: true, timeout: 5000 });
        console.log("Got location for offline session end:", locationToUse);
      } catch (err) {
        console.error("Could not get location for session end:", err);
      }
    }
    
    const updateData: Partial<OfflineSession> = {
      endTime,
      // Increase sync priority for completed sessions
      syncPriority: 20
    };
    
    // Only add location data if we have it
    if (locationToUse) {
      updateData.endLatitude = locationToUse.latitude;
      updateData.endLongitude = locationToUse.longitude;
      updateData.endAddress = locationToUse.address || null;
    }
    
    // Get the current session to preserve uniqueKey and other fields
    const existingSession = await offlineDB.sessions.get(id);
    if (existingSession) {
      // Make sure we keep the uniqueKey
      updateData.uniqueKey = existingSession.uniqueKey;
    }
    
    await offlineDB.sessions.update(id, updateData);
    
    logSync('UpdateSession', 'Session updated', 'success', `Offline session ${id} updated with end details`, id);
    console.log("Offline session updated with end details:", id, updateData);
    
    // Try to register background sync with debouncing
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const syncInProgress = localStorage.getItem("sync_in_progress");
        const lastSyncTime = localStorage.getItem("last_sync_attempt");
        
        const now = Date.now();
        let shouldSync = true;
        
        if (syncInProgress === "true" && lastSyncTime) {
          // Only override if the last sync attempt was too long ago (possible stalled sync)
          const timeSinceLastSync = now - parseInt(lastSyncTime);
          if (timeSinceLastSync < 30000) { // 30 seconds
            shouldSync = false;
          }
        }
        
        if (shouldSync) {
          localStorage.setItem("last_sync_attempt", now.toString());
          
          const registration = await navigator.serviceWorker.ready;
          if (registration.sync) {
            await registration.sync.register('sync-sessions');
          } else {
            console.log('Background sync not available');
          }
        } else {
          console.log("Sync already in progress, skipping additional sync request");
        }
      } catch (err) {
        console.error('Background sync registration failed:', err);
      }
    }
  } catch (error) {
    console.error("Error updating offline session:", error);
    logSync('UpdateSession', 'Error', 'error', `Error updating offline session ${id}: ${error}`, id);
    throw error;
  }
};

// Save interview to the offline database
export const saveOfflineInterview = async (
  sessionId: number,
  candidateName: string,
  projectId: string | null,
  startTime: string,
  startLocation?: Location
): Promise<number> => {
  try {
    const id = await offlineDB.interviews.add({
      sessionId,
      supabaseSessionId: null,
      candidateName,
      projectId,
      startTime,
      startLatitude: startLocation?.latitude || null,
      startLongitude: startLocation?.longitude || null,
      startAddress: startLocation?.address || null,
      endTime: null,
      endLatitude: null,
      endLongitude: null,
      endAddress: null,
      result: null,
      synced: 0,
      syncing: 0,
      syncAttempts: 0,
      lastSyncAttempt: null,
      syncError: null
    });
    
    logSync('SaveInterview', 'Interview saved', 'success', `Offline interview saved with ID: ${id}`, sessionId, id);
    console.log("Interview saved locally:", id);
    return id;
  } catch (error) {
    console.error("Error saving offline interview:", error);
    logSync('SaveInterview', 'Error', 'error', `Error saving offline interview: ${error}`);
    throw error;
  }
};

// Update an offline interview with end details
export const updateOfflineInterview = async (
  id: number,
  endTime: string,
  endLocation?: Location
): Promise<void> => {
  try {
    console.log("Updating offline interview with end location:", endLocation);
    
    // If no location provided, try to get it
    let locationToUse = endLocation;
    if (!locationToUse) {
      try {
        locationToUse = await getCurrentLocation({ highAccuracy: true, timeout: 5000 });
        console.log("Got location for offline interview end:", locationToUse);
      } catch (err) {
        console.error("Could not get location for interview end:", err);
      }
    }
    
    const updateData: Partial<OfflineInterview> = {
      endTime
    };
    
    // Only add location data if we have it
    if (locationToUse) {
      updateData.endLatitude = locationToUse.latitude;
      updateData.endLongitude = locationToUse.longitude;
      updateData.endAddress = locationToUse.address || null;
    }
    
    await offlineDB.interviews.update(id, updateData);
    
    logSync('UpdateInterview', 'Interview updated', 'success', `Offline interview ${id} updated with end details`, null, id);
    console.log("Offline interview updated with end details:", id);
  } catch (error) {
    console.error("Error updating offline interview:", error);
    logSync('UpdateInterview', 'Error', 'error', `Error updating offline interview ${id}: ${error}`, null, id);
    throw error;
  }
};

// Update interview result
export const updateOfflineInterviewResult = async (
  id: number,
  result: string
): Promise<void> => {
  try {
    await offlineDB.interviews.update(id, { result });
    
    logSync('SetInterviewResult', 'Result set', 'success', `Offline interview ${id} result set to: ${result}`, null, id);
    console.log(`Interview ${id} result set to ${result}`);
  } catch (error) {
    console.error("Error setting interview result:", error);
    logSync('SetInterviewResult', 'Error', 'error', `Error setting result for interview ${id}: ${error}`, null, id);
    throw error;
  }
};

// Get offline interviews for a session
export const getInterviewsForOfflineSession = async (sessionId: number): Promise<OfflineInterview[]> => {
  try {
    return await offlineDB.interviews
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  } catch (error) {
    console.error("Error getting interviews for offline session:", error);
    logSync('GetInterviews', 'Error', 'error', `Error getting interviews for session ${sessionId}: ${error}`, sessionId);
    return [];
  }
};

// Get a specific offline interview
export const getOfflineInterview = async (id: number): Promise<OfflineInterview | undefined> => {
  try {
    return await offlineDB.interviews.get(id);
  } catch (error) {
    console.error("Error getting offline interview:", error);
    logSync('GetInterview', 'Error', 'error', `Error getting interview ${id}: ${error}`, null, id);
    return undefined;
  }
};

// Get total unsynced session count
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    return await offlineDB.sessions
      .where('synced')
      .equals(0)
      .count();
  } catch (error) {
    console.error("Error getting unsynced sessions count:", error);
    return 0;
  }
};

// Get total unsynced interviews count
export const getUnsyncedInterviewsCount = async (): Promise<number> => {
  try {
    return await offlineDB.interviews
      .where('synced')
      .equals(0)
      .count();
  } catch (error) {
    console.error("Error getting unsynced interviews count:", error);
    return 0;
  }
};

// Get detailed sync status
export const getSyncStatus = async (): Promise<{
  sessionsTotal: number;
  sessionsUnsynced: number;
  sessionsInProgress: number;
  interviewsTotal: number;
  interviewsUnsynced: number;
  interviewsInProgress: number;
  lastSync: string | null;
  currentLock: any | null;
}> => {
  try {
    // Get session counts
    const sessionsTotal = await offlineDB.sessions.count();
    const sessionsUnsynced = await offlineDB.sessions.where('synced').equals(0).count();
    const sessionsInProgress = await offlineDB.sessions.where('syncing').equals(1).count();
    
    // Get interview counts
    const interviewsTotal = await offlineDB.interviews.count();
    const interviewsUnsynced = await offlineDB.interviews.where('synced').equals(0).count();
    const interviewsInProgress = await offlineDB.interviews.where('syncing').equals(1).count();
    
    // Get last successful sync log
    const lastSyncLogs = await offlineDB.syncLogs
      .where('action')
      .equals('SessionSync')
      .reverse()
      .limit(1)
      .toArray();
      
    const lastSync = lastSyncLogs.length > 0 ? lastSyncLogs[0].timestamp : null;
    
    // Get current lock
    const currentLock = await offlineDB.syncLock.get(1);
    
    return {
      sessionsTotal,
      sessionsUnsynced,
      sessionsInProgress,
      interviewsTotal,
      interviewsUnsynced,
      interviewsInProgress,
      lastSync,
      currentLock
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    return {
      sessionsTotal: 0,
      sessionsUnsynced: 0,
      sessionsInProgress: 0,
      interviewsTotal: 0,
      interviewsUnsynced: 0,
      interviewsInProgress: 0,
      lastSync: null,
      currentLock: null
    };
  }
};

// Reset in-progress flags for any stalled operations
export const resetStalledOperations = async (): Promise<void> => {
  try {
    // Find sessions that have been marked as syncing for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Reset sessions
    const stalledSessions = await offlineDB.sessions
      .where('syncing')
      .equals(1)
      .and(s => !!s.lastSyncAttempt && s.lastSyncAttempt < fiveMinutesAgo)
      .toArray();
    
    if (stalledSessions.length > 0) {
      console.log(`Resetting ${stalledSessions.length} stalled sessions`);
      
      for (const session of stalledSessions) {
        await offlineDB.sessions.update(session.id as number, {
          syncing: 0,
          syncAttempts: (session.syncAttempts || 0) + 1,
          syncError: `Sync operation stalled and was reset at ${new Date().toISOString()}`
        });
        
        logSync('ResetStalled', 'Session reset', 'warning', `Reset stalled sync for session ${session.id}`, session.id);
      }
    }
    
    // Reset interviews
    const stalledInterviews = await offlineDB.interviews
      .where('syncing')
      .equals(1)
      .and(i => !!i.lastSyncAttempt && i.lastSyncAttempt < fiveMinutesAgo)
      .toArray();
    
    if (stalledInterviews.length > 0) {
      console.log(`Resetting ${stalledInterviews.length} stalled interviews`);
      
      for (const interview of stalledInterviews) {
        await offlineDB.interviews.update(interview.id as number, {
          syncing: 0,
          syncAttempts: (interview.syncAttempts || 0) + 1,
          syncError: `Sync operation stalled and was reset at ${new Date().toISOString()}`
        });
        
        logSync('ResetStalled', 'Interview reset', 'warning', `Reset stalled sync for interview ${interview.id}`, interview.sessionId, interview.id);
      }
    }
    
    // Reset any locks that have been held for too long
    await clearExpiredLocks();
    
  } catch (error) {
    console.error("Error resetting stalled operations:", error);
  }
};

// Function to check if a session already exists in Supabase to prevent duplicates
const checkSessionExists = async (interviewerCode: string, startTime: string, projectId: string | null): Promise<string | null> => {
  if (!isOnline()) return null;
  
  try {
    // Get interviewer ID from code
    const interviewer = await getInterviewerByCode(interviewerCode);
    if (!interviewer) return null;
    
    // Use a time range to account for slight time differences
    const startTimeObj = new Date(startTime);
    const startTimeFloor = new Date(startTimeObj.getTime() - 60000).toISOString(); // 1 minute before
    const startTimeCeiling = new Date(startTimeObj.getTime() + 60000).toISOString(); // 1 minute after
    
    console.log(`Checking for existing session with: 
      interviewer_id: ${interviewer.id}
      startTime range: ${startTimeFloor} to ${startTimeCeiling}
      projectId: ${projectId || 'null'}`);
    
    let query = supabase
      .from('sessions')
      .select('id, start_time')
      .eq('interviewer_id', interviewer.id)
      .gte('start_time', startTimeFloor)
      .lte('start_time', startTimeCeiling);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking for existing session:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      // Found existing session(s), return the closest match
      console.log("Found existing sessions:", data);
      
      if (data.length === 1) {
        return data[0].id;
      }
      
      // If multiple matches, find the closest by start time
      let closestSession = data[0];
      let minDiff = Math.abs(new Date(data[0].start_time).getTime() - startTimeObj.getTime());
      
      for (let i = 1; i < data.length; i++) {
        const diff = Math.abs(new Date(data[i].start_time).getTime() - startTimeObj.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestSession = data[i];
        }
      }
      
      return closestSession.id;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking if session exists:", error);
    return null;
  }
};

// Sync a single offline session to Supabase
export const syncOfflineSession = async (sessionId: number): Promise<boolean> => {
  if (!isOnline()) return false;
  
  // Set this session as currently syncing
  let sessionRecord;
  
  try {
    await offlineDB.sessions.update(sessionId, { 
      syncing: 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Get the offline session data
    sessionRecord = await offlineDB.sessions.get(sessionId);
    if (!sessionRecord) {
      console.error("Session not found:", sessionId);
      return false;
    }
    
    // Skip if already synced
    if (sessionRecord.synced === 1 && sessionRecord.supabaseId) {
      console.log("Session already synced:", sessionRecord.supabaseId);
      return true;
    }
    
    // Log sync attempt
    logSync('SessionSync', 'Sync started', 'success', 
      `Attempting to sync session ${sessionId} (${sessionRecord.interviewerCode}, ${sessionRecord.startTime})`,
      sessionId);
    
    // Check if this session already exists in Supabase
    const existingSessionId = await checkSessionExists(
      sessionRecord.interviewerCode, 
      sessionRecord.startTime,
      sessionRecord.projectId
    );
    
    if (existingSessionId) {
      console.log("Found existing session in Supabase:", existingSessionId);
      
      // Update our local record to mark it as synced
      await offlineDB.sessions.update(sessionId, {
        synced: 1,
        syncing: 0,
        supabaseId: existingSessionId,
        syncAttempts: (sessionRecord.syncAttempts || 0) + 1
      });
      
      logSync('SessionSync', 'Found existing', 'success', 
        `Session ${sessionId} matched to existing Supabase session ${existingSessionId}`, 
        sessionId);
      
      // Now sync any interviews for this session
      const interviews = await getInterviewsForOfflineSession(sessionId);
      
      for (const interview of interviews) {
        if (interview.synced === 0) {
          await syncOfflineInterview(interview.id as number, existingSessionId);
        }
      }
      
      return true;
    }
    
    // Get interviewer ID from code
    const interviewer = await getInterviewerByCode(sessionRecord.interviewerCode);
    if (!interviewer) {
      console.error("Interviewer not found:", sessionRecord.interviewerCode);
      
      // Update session to mark sync attempt
      await offlineDB.sessions.update(sessionId, {
        syncing: 0,
        syncAttempts: (sessionRecord.syncAttempts || 0) + 1,
        syncError: `Interviewer not found: ${sessionRecord.interviewerCode}`
      });
      
      logSync('SessionSync', 'Interviewer not found', 'error', 
        `Could not find interviewer with code ${sessionRecord.interviewerCode}`, 
        sessionId);
      
      return false;
    }
    
    // Create session in Supabase
    const sessionData = {
      interviewer_id: interviewer.id,
      project_id: sessionRecord.projectId,
      start_time: sessionRecord.startTime,
      start_latitude: sessionRecord.startLatitude,
      start_longitude: sessionRecord.startLongitude,
      start_address: sessionRecord.startAddress,
      is_active: sessionRecord.endTime ? false : true
    };
    
    // Add end details if session is complete
    if (sessionRecord.endTime) {
      Object.assign(sessionData, {
        end_time: sessionRecord.endTime,
        end_latitude: sessionRecord.endLatitude,
        end_longitude: sessionRecord.endLongitude,
        end_address: sessionRecord.endAddress
      });
    }
    
    // Insert session into Supabase
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select();
      
    if (error) {
      console.error("Error inserting session:", error);
      
      // Update session to mark sync attempt
      await offlineDB.sessions.update(sessionId, {
        syncing: 0,
        syncAttempts: (sessionRecord.syncAttempts || 0) + 1,
        syncError: `Error inserting: ${error.message}`
      });
      
      logSync('SessionSync', 'Insert error', 'error', 
        `Error inserting session ${sessionId}: ${error.message}`, 
        sessionId);
      
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error("No data returned from session insert");
      
      // Update session to mark sync attempt
      await offlineDB.sessions.update(sessionId, {
        syncing: 0,
        syncAttempts: (sessionRecord.syncAttempts || 0) + 1,
        syncError: "No data returned from insert"
      });
      
      logSync('SessionSync', 'No data returned', 'error', 
        `No data returned from inserting session ${sessionId}`, 
        sessionId);
      
      return false;
    }
    
    const supabaseSessionId = data[0].id;
    
    // Update local record with Supabase ID and mark as synced
    await offlineDB.sessions.update(sessionId, {
      synced: 1,
      syncing: 0,
      supabaseId: supabaseSessionId,
      syncAttempts: (sessionRecord.syncAttempts || 0) + 1,
      syncError: null
    });
    
    logSync('SessionSync', 'Session synced', 'success', 
      `Successfully synced session ${sessionId} to Supabase ID ${supabaseSessionId}`, 
      sessionId);
    
    console.log("Session synced to Supabase:", supabaseSessionId);
    
    // Now sync any interviews for this session
    const interviews = await getInterviewsForOfflineSession(sessionId);
    
    for (const interview of interviews) {
      if (interview.synced === 0) {
        await syncOfflineInterview(interview.id as number, supabaseSessionId);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing session:", error);
    
    try {
      // Update session to mark sync attempt
      await offlineDB.sessions.update(sessionId, {
        syncing: 0,
        syncAttempts: (sessionRecord?.syncAttempts || 0) + 1,
        syncError: `Error: ${error}`
      });
      
      logSync('SessionSync', 'Sync error', 'error', 
        `Error syncing session ${sessionId}: ${error}`, 
        sessionId);
    } catch (e) {
      console.error("Error updating session after sync failure:", e);
    }
    
    return false;
  }
};

// Sync a single offline interview to Supabase
export const syncOfflineInterview = async (interviewId: number, supabaseSessionId: string): Promise<boolean> => {
  if (!isOnline()) return false;
  
  let interviewRecord;
  
  try {
    // Mark interview as syncing
    await offlineDB.interviews.update(interviewId, { 
      syncing: 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Get the offline interview data
    interviewRecord = await offlineDB.interviews.get(interviewId);
    if (!interviewRecord) {
      console.error("Interview not found:", interviewId);
      return false;
    }
    
    // Skip if already synced
    if (interviewRecord.synced === 1) {
      console.log("Interview already synced:", interviewId);
      return true;
    }
    
    logSync('InterviewSync', 'Sync started', 'success', 
      `Attempting to sync interview ${interviewId} for session ${interviewRecord.sessionId}`,
      interviewRecord.sessionId, interviewId);
    
    // Create interview in Supabase
    const interviewData = {
      session_id: supabaseSessionId,
      candidate_name: interviewRecord.candidateName,
      start_time: interviewRecord.startTime,
      start_latitude: interviewRecord.startLatitude,
      start_longitude: interviewRecord.startLongitude,
      start_address: interviewRecord.startAddress,
      is_active: interviewRecord.endTime ? false : true
    };
    
    // Add end details if interview is complete
    if (interviewRecord.endTime) {
      Object.assign(interviewData, {
        end_time: interviewRecord.endTime,
        end_latitude: interviewRecord.endLatitude,
        end_longitude: interviewRecord.endLongitude,
        end_address: interviewRecord.endAddress
      });
    }
    
    // Add result if available
    if (interviewRecord.result) {
      Object.assign(interviewData, {
        result: interviewRecord.result
      });
    }
    
    // Insert interview into Supabase
    const { error } = await supabase
      .from('interviews')
      .insert([interviewData]);
      
    if (error) {
      console.error("Error inserting interview:", error);
      
      // Update interview to mark sync attempt
      await offlineDB.interviews.update(interviewId, {
        syncing: 0,
        syncAttempts: (interviewRecord.syncAttempts || 0) + 1,
        syncError: `Error inserting: ${error.message}`
      });
      
      logSync('InterviewSync', 'Insert error', 'error', 
        `Error inserting interview ${interviewId}: ${error.message}`,
        interviewRecord.sessionId, interviewId);
      
      return false;
    }
    
    // Update local record to mark as synced
    await offlineDB.interviews.update(interviewId, {
      synced: 1,
      syncing: 0,
      supabaseSessionId: supabaseSessionId,
      syncAttempts: (interviewRecord.syncAttempts || 0) + 1,
      syncError: null
    });
    
    logSync('InterviewSync', 'Interview synced', 'success', 
      `Successfully synced interview ${interviewId} to session ${supabaseSessionId}`,
      interviewRecord.sessionId, interviewId);
    
    console.log(`Interview ${interviewId} synced to Supabase session ${supabaseSessionId}`);
    
    return true;
  } catch (error) {
    console.error("Error syncing interview:", error);
    
    try {
      // Update interview to mark sync attempt
      await offlineDB.interviews.update(interviewId, {
        syncing: 0,
        syncAttempts: (interviewRecord?.syncAttempts || 0) + 1,
        syncError: `Error: ${error}`
      });
      
      logSync('InterviewSync', 'Sync error', 'error', 
        `Error syncing interview ${interviewId}: ${error}`,
        interviewRecord?.sessionId, interviewId);
    } catch (e) {
      console.error("Error updating interview after sync failure:", e);
    }
    
    return false;
  }
};

// Migration function to add uniqueKey to existing sessions
export const migrateExistingSessions = async (): Promise<void> => {
  try {
    const sessions = await offlineDB.sessions.toArray();
    let migratedCount = 0;
    
    for (const session of sessions) {
      // Skip if already has uniqueKey
      if (session.uniqueKey) continue;
      
      const uniqueKey = generateSessionUniqueKey(
        session.interviewerCode, 
        session.startTime, 
        session.projectId
      );
      
      await offlineDB.sessions.update(session.id!, {
        uniqueKey,
        syncing: 0,
        syncAttempts: session.syncAttempts || 0,
        lastSyncAttempt: session.lastSyncAttempt || null
      });
      
      migratedCount++;
    }
    
    console.log(`Migrated ${migratedCount} sessions to include uniqueKey`);
  } catch (error) {
    console.error("Error migrating sessions:", error);
  }
};

// Run migrations on database upgrade
migrateExistingSessions().catch(console.error);

/**
 * Sync offline sessions and interviews to the server using the new sync queue system
 */
export async function syncOfflineSessions(): Promise<boolean> {
  if (!isOnline()) {
    console.warn("Cannot sync while offline");
    return false;
  }

  try {
    // Attempt to get sync lock
    const syncId = `auto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lockAcquired = await acquireSyncLock(syncId);
    
    if (!lockAcquired) {
      console.log("Could not acquire sync lock, another sync is in progress");
      return false;
    }
    
    await logSync('AutoSync', 'Started', 'success', 'Auto sync started by syncOfflineSessions');
    
    // Import the sync queue here to prevent circular imports
    const { syncQueue } = await import('./syncQueue');
    
    // Trigger sync through the sync queue
    const syncSuccessful = await syncQueue.attemptSync(true);
    
    if (syncSuccessful) {
      await logSync('AutoSync', 'Completed', 'success', 'Auto sync completed successfully');
    } else {
      await logSync('AutoSync', 'Failed', 'error', 'Auto sync encountered errors');
    }
    
    // Always release the lock
    await releaseSyncLock(syncId);
    
    return syncSuccessful;
  } catch (error) {
    console.error("Error syncing offline sessions:", error);
    await logSync('AutoSync', 'Error', 'error', `Sync error: ${error}`);
    return false;
  }
}
