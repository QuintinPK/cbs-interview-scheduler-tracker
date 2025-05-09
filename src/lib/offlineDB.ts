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

// Create a Dexie database class
class OfflineDatabase extends Dexie {
  interviewers!: Table<OfflineInterviewer>;
  sessions!: Table<OfflineSession>;
  interviews!: Table<OfflineInterview>;
  projects!: Table<OfflineProject>;
  syncLock!: Table<SyncLock>;

  constructor() {
    super('offlineSessionsDB');
    
    // Update the database schema to include all tables we need
    this.version(4).stores({
      interviewers: '++id, code',
      sessions: '++id, interviewerCode, startTime, synced, supabaseId, uniqueKey, syncing',
      interviews: '++id, sessionId, startTime, endTime, synced, supabaseSessionId',
      projects: 'id, name',
      syncLock: 'id, isLocked, lockedAt'
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
  } catch (error) {
    console.error("Error initializing sync lock:", error);
  }
})();

// Check if a network connection is available
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Acquire a sync lock with a timeout mechanism
export const acquireSyncLock = async (lockId: string, timeoutMs: number = 30000): Promise<boolean> => {
  try {
    // Check if the lock is already acquired
    const lock = await offlineDB.syncLock.get(1);
    if (!lock) {
      console.error("Sync lock record not found");
      return false;
    }
    
    // If the lock is already locked, check if it's expired
    if (lock.isLocked === 1) {
      if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) {
        // Lock is expired, force release it
        console.log("Expired lock found, force releasing...");
        await offlineDB.syncLock.update(1, {
          isLocked: 0,
          lockedAt: null,
          lockedBy: null,
          expiresAt: null
        });
      } else {
        // Lock is active and not expired
        console.log("Sync already in progress by:", lock.lockedBy);
        return false;
      }
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
    
    console.log("Sync lock acquired by:", lockId);
    return true;
  } catch (error) {
    console.error("Error acquiring sync lock:", error);
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
    if (lock.isLocked === 1 && lock.lockedBy === lockId) {
      await offlineDB.syncLock.update(1, {
        isLocked: 0,
        lockedAt: null,
        lockedBy: null,
        expiresAt: null
      });
      console.log("Sync lock released by:", lockId);
      return true;
    } else {
      console.log("Cannot release lock - not owned by:", lockId);
      return false;
    }
  } catch (error) {
    console.error("Error releasing sync lock:", error);
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
      
      console.log("Interviewer cached for offline use:", data.code);
    }
  } catch (error) {
    console.error("Error caching interviewer:", error);
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
    
    console.log(`${projects.length} projects cached for offline use`);
  } catch (error) {
    console.error("Error caching projects:", error);
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
      lastSyncAttempt: null
    });
    
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
      endTime
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
      synced: 0
    });
    
    console.log("Interview saved locally:", id);
    return id;
  } catch (error) {
    console.error("Error saving offline interview:", error);
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
    await offlineDB.interviews.update(id, {
      endTime,
      endLatitude: endLocation?.latitude || null,
      endLongitude: endLocation?.longitude || null,
      endAddress: endLocation?.address || null
    });
    
    console.log("Offline interview updated:", id);
  } catch (error) {
    console.error("Error updating offline interview:", error);
    throw error;
  }
};

// Set interview result
export const setOfflineInterviewResult = async (
  id: number,
  result: 'response' | 'non-response'
): Promise<void> => {
  try {
    await offlineDB.interviews.update(id, {
      result
    });
    
    console.log("Offline interview result set:", id, result);
  } catch (error) {
    console.error("Error setting offline interview result:", error);
    throw error;
  }
};

// Synchronize offline sessions with the server - with improved deduplication
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isOnline()) {
    return false;
  }

  const syncId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Try to acquire the sync lock
  const lockAcquired = await acquireSyncLock(syncId);
  if (!lockAcquired) {
    console.log("Could not acquire sync lock, another sync may be in progress");
    return false;
  }

  // Set global sync flag
  localStorage.setItem("sync_in_progress", "true");
  localStorage.setItem("last_sync_attempt", Date.now().toString());

  try {
    console.log(`Starting synchronization with ID: ${syncId}`);

    // Get all unsynced sessions that are not currently being synced
    const unsyncedSessions = await offlineDB.sessions
      .where('synced')
      .equals(0)
      .and(session => session.syncing === 0)
      .toArray();
      
    if (unsyncedSessions.length === 0) {
      console.log("No unsynced sessions to sync");
      return true;
    }
    
    console.log(`Attempting to sync ${unsyncedSessions.length} offline sessions...`);
    
    let syncedCount = 0;
    
    for (const session of unsyncedSessions) {
      try {
        // Mark this session as currently syncing
        await offlineDB.sessions.update(session.id!, { 
          syncing: 1,
          syncAttempts: (session.syncAttempts || 0) + 1,
          lastSyncAttempt: new Date().toISOString()
        });

        console.log(`Processing session ${session.id} with uniqueKey: ${session.uniqueKey}`);
        
        // First get the interviewer ID from the code
        const cachedInterviewer = await getInterviewerByCode(session.interviewerCode);
        
        if (!cachedInterviewer) {
          console.error("Could not find interviewer with code:", session.interviewerCode);
          // Revert syncing flag
          await offlineDB.sessions.update(session.id!, { syncing: 0 });
          continue;
        }
        
        const interviewerId = cachedInterviewer.id;
        
        // Use a transaction to ensure consistency
        const existingSession = await checkForExistingSession(interviewerId, session);
        
        if (existingSession) {
          console.log(`Found existing session in Supabase with ID: ${existingSession.id}`);
          
          // If the session already exists, update it if needed
          if (session.endTime) {
            console.log(`Updating existing session ${existingSession.id} with end details`);
            
            await supabase
              .from('sessions')
              .update({
                end_time: session.endTime,
                end_latitude: session.endLatitude,
                end_longitude: session.endLongitude,
                end_address: session.endAddress,
                is_active: false
              })
              .eq('id', existingSession.id);
          }
          
          // Mark our local session as synced with the supabase ID
          await offlineDB.sessions.update(session.id!, { 
            synced: 1, 
            supabaseId: existingSession.id,
            syncing: 0
          });
          
          // Now sync any interviews associated with this session
          await syncInterviewsForSession(session.id!, existingSession.id);
          
          syncedCount++;
          continue;
        }
        
        console.log(`No existing session found in Supabase, creating new session for interviewer: ${interviewerId}`);
        
        // Create session in Supabase using a transaction
        const sessionData = {
          interviewer_id: interviewerId,
          project_id: session.projectId,
          start_time: session.startTime,
          start_latitude: session.startLatitude,
          start_longitude: session.startLongitude,
          start_address: session.startAddress,
          is_active: !session.endTime,
        };
        
        if (session.endTime) {
          Object.assign(sessionData, {
            end_time: session.endTime,
            end_latitude: session.endLatitude,
            end_longitude: session.endLongitude,
            end_address: session.endAddress
          });
        }
        
        const { data: supabaseSession, error: insertError } = await supabase
          .from('sessions')
          .insert([sessionData])
          .select()
          .single();
          
        if (insertError) {
          console.error("Error syncing session to server:", insertError);
          // Revert syncing flag
          await offlineDB.sessions.update(session.id!, { syncing: 0 });
          continue;
        }
        
        if (!supabaseSession) {
          console.error("No session data returned after insert");
          // Revert syncing flag
          await offlineDB.sessions.update(session.id!, { syncing: 0 });
          continue;
        }
        
        console.log(`Created new session in Supabase with ID: ${supabaseSession.id}`);
        
        // Store the Supabase session ID in the local session
        await offlineDB.sessions.update(session.id!, { 
          synced: 1, 
          supabaseId: supabaseSession.id,
          syncing: 0
        });
        
        // Now sync any interviews associated with this session
        await syncInterviewsForSession(session.id!, supabaseSession.id);
        
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing individual session ${session.id}:`, error);
        // Revert syncing flag
        await offlineDB.sessions.update(session.id!, { syncing: 0 });
      }
    }
    
    if (syncedCount > 0) {
      toast(`${syncedCount} offline ${syncedCount === 1 ? 'session' : 'sessions'} synchronized with the server`);
      return true;
    }
    
    return syncedCount === unsyncedSessions.length;
    
  } catch (error) {
    console.error("Error during session synchronization:", error);
    return false;
  } finally {
    // Release the sync lock and clean up
    await releaseSyncLock(syncId);
    localStorage.removeItem("sync_in_progress");
    console.log(`Synchronization ${syncId} complete`);
  }
};

// Helper function to check for existing sessions with robust deduplication
const checkForExistingSession = async (interviewerId: string, session: OfflineSession): Promise<any | null> => {
  try {
    console.log(`Checking for existing session with interviewer ${interviewerId}, start_time ${session.startTime}, project ${session.projectId || 'null'}`);
    
    // First try the most specific query
    const { data: specificMatch, error: specificError } = await supabase
      .from('sessions')
      .select('*')
      .eq('interviewer_id', interviewerId)
      .eq('start_time', session.startTime);
    
    if (specificError) {
      console.error("Error checking for existing session (specific query):", specificError);
      return null;
    }
    
    // If we found exact matches on interviewer_id and start_time
    if (specificMatch && specificMatch.length > 0) {
      // Try to find an exact match with project_id too
      const projectMatch = specificMatch.find(s => s.project_id === session.projectId);
      if (projectMatch) {
        console.log("Found existing session with matching project_id");
        return projectMatch;
      }
      
      // If no match with project_id, return the first match
      // This is a compromise as we have a match on interviewer and time
      console.log("Found existing session without matching project_id, using first match");
      return specificMatch[0];
    }
    
    // If we get here, we didn't find an exact match - try a fuzzy time match
    // This handles cases where clocks might be slightly off
    const startTimestamp = new Date(session.startTime).getTime();
    const timeWindow = 60000; // 1 minute in milliseconds
    
    const minTime = new Date(startTimestamp - timeWindow).toISOString();
    const maxTime = new Date(startTimestamp + timeWindow).toISOString();
    
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .from('sessions')
      .select('*')
      .eq('interviewer_id', interviewerId)
      .gte('start_time', minTime)
      .lte('start_time', maxTime);
      
    if (fuzzyError) {
      console.error("Error checking for existing session (fuzzy query):", fuzzyError);
      return null;
    }
    
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      // Try to find the best match with project_id
      const projectMatch = fuzzyMatches.find(s => s.project_id === session.projectId);
      if (projectMatch) {
        console.log("Found fuzzy match session with matching project_id");
        return projectMatch;
      }
      
      // If no match with project_id, return the closest match by time
      console.log("Found fuzzy match session without matching project_id, using closest match");
      return fuzzyMatches.sort((a, b) => {
        const aTime = Math.abs(new Date(a.start_time).getTime() - startTimestamp);
        const bTime = Math.abs(new Date(b.start_time).getTime() - startTimestamp);
        return aTime - bTime;
      })[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error in checkForExistingSession:", error);
    return null;
  }
};

// Sync interviews for a specific session
export const syncInterviewsForSession = async (
  localSessionId: number,
  supabaseSessionId: string
): Promise<boolean> => {
  try {
    // Find all unsynced interviews for this session
    const interviews = await offlineDB.interviews
      .where('sessionId')
      .equals(localSessionId)
      .and(interview => interview.synced === 0)
      .toArray();
    
    if (interviews.length === 0) {
      return true;
    }
    
    console.log(`Syncing ${interviews.length} interviews for session ${localSessionId} -> ${supabaseSessionId}`);
    
    let syncedCount = 0;
    
    for (const interview of interviews) {
      try {
        // Create interview in Supabase
        const interviewData = {
          session_id: supabaseSessionId,
          project_id: interview.projectId,
          candidate_name: interview.candidateName,
          start_time: interview.startTime,
          start_latitude: interview.startLatitude,
          start_longitude: interview.startLongitude,
          start_address: interview.startAddress,
          is_active: !interview.endTime,
        };
        
        if (interview.endTime) {
          Object.assign(interviewData, {
            end_time: interview.endTime,
            end_latitude: interview.endLatitude,
            end_longitude: interview.endLongitude,
            end_address: interview.endAddress
          });
        }
        
        if (interview.result) {
          Object.assign(interviewData, {
            result: interview.result,
            is_active: false
          });
        }
        
        const { error: insertError } = await supabase
          .from('interviews')
          .insert([interviewData]);
          
        if (insertError) {
          console.error("Error syncing interview to server:", insertError);
          continue;
        }
        
        // Mark interview as synced
        await offlineDB.interviews.update(interview.id!, { 
          synced: 1,
          supabaseSessionId 
        });
        
        syncedCount++;
      } catch (error) {
        console.error("Error syncing individual interview:", error);
      }
    }
    
    console.log(`Synced ${syncedCount}/${interviews.length} interviews for session ${localSessionId}`);
    return syncedCount === interviews.length;
  } catch (error) {
    console.error("Error syncing interviews:", error);
    return false;
  }
};

// Get the count of unsynced sessions
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    return await offlineDB.sessions
      .where('synced')
      .equals(0)
      .count();
  } catch (error) {
    console.error("Error counting unsynced sessions:", error);
    return 0;
  }
};

// Get the count of unsynced interviews
export const getUnsyncedInterviewsCount = async (): Promise<number> => {
  try {
    return await offlineDB.interviews
      .where('synced')
      .equals(0)
      .count();
  } catch (error) {
    console.error("Error counting unsynced interviews:", error);
    return 0;
  }
};

// Check if the app has offline capability
export const hasOfflineCapability = (): boolean => {
  return 'indexedDB' in window && 'serviceWorker' in navigator;
};

// Clear all synced sessions
export const clearSyncedSessions = async (): Promise<void> => {
  try {
    await offlineDB.sessions
      .where('synced')
      .equals(1)
      .delete();
    console.log("Cleared synced sessions from local DB");
  } catch (error) {
    console.error("Error clearing synced sessions:", error);
  }
};

// Clear all synced interviews 
export const clearSyncedInterviews = async (): Promise<void> => {
  try {
    await offlineDB.interviews
      .where('synced')
      .equals(1)
      .delete();
    console.log("Cleared synced interviews from local DB");
  } catch (error) {
    console.error("Error clearing synced interviews:", error);
  }
};

// Get interviews for a local session
export const getInterviewsForOfflineSession = async (sessionId: number): Promise<OfflineInterview[]> => {
  try {
    const interviews = await offlineDB.interviews
      .where('sessionId')
      .equals(sessionId)
      .toArray();
    return interviews;
  } catch (error) {
    console.error("Error getting interviews for session:", error);
    return [];
  }
};

// Get a specific offline interview
export const getOfflineInterview = async (interviewId: number): Promise<OfflineInterview | undefined> => {
  try {
    return await offlineDB.interviews.get(interviewId);
  } catch (error) {
    console.error("Error getting offline interview:", error);
    return undefined;
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
