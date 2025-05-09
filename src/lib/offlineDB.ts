
import Dexie, { Table } from 'dexie';
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, formatTimeDifference } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Define interfaces for offline storage
interface OfflineSession {
  id?: number;
  uuid: string;  // Add unique UUID for each session
  interviewerCode: string;
  projectId: string | null;
  startTime: string;
  endTime: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  startAddress?: string | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  endAddress?: string | null;
  synced: boolean;
  syncInProgress: boolean;
  syncAttempts: number;
  lastSyncAttempt: string | null;
  created: string;
}

interface OfflineInterview {
  id?: number;
  uuid: string;  // Add unique UUID for each interview
  sessionId: number;
  candidateName: string;
  projectId: string | null;
  startTime: string;
  endTime: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  startAddress?: string | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  endAddress?: string | null;
  result: 'response' | 'non-response' | null;
  synced: boolean;
  syncInProgress: boolean;
  syncAttempts: number;
  lastSyncAttempt: string | null;
  created: string;
}

interface OfflineProject {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  excluded_islands?: string[];
}

interface OfflineInterviewer {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  island?: string;
}

interface SyncLog {
  id?: number;
  operation: string;
  status: 'Started' | 'Completed' | 'Error';
  result: 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

// Define database class
class OfflineDatabase extends Dexie {
  sessions!: Table<OfflineSession>;
  interviews!: Table<OfflineInterview>;
  projects!: Table<OfflineProject>;
  interviewers!: Table<OfflineInterviewer>;
  syncLock!: Table<{id: number, isLocked: number, lockedBy: string, timestamp: string, expiresAt: string}>;
  syncLog!: Table<SyncLog>;

  constructor() {
    super('OfflineDatabase');
    this.version(1).stores({
      sessions: '++id, uuid, interviewerCode, projectId, startTime, endTime, synced, syncInProgress',
      interviews: '++id, uuid, sessionId, startTime, endTime, result, synced, syncInProgress',
      projects: 'id, name',
      interviewers: 'id, code',
      syncLock: 'id, isLocked, lockedBy, timestamp, expiresAt',
      syncLog: '++id, operation, status, result, timestamp'
    });
  }
}

// Create database instance
const db = new OfflineDatabase();

// Initialize functions
export function isOnline() {
  return navigator.onLine;
}

// Cache an interviewer for offline use
export async function cacheInterviewer(interviewerCode: string) {
  try {
    // First check if the interviewer is already cached
    const existingInterviewer = await db.interviewers.where('code').equals(interviewerCode).first();
    
    if (existingInterviewer) {
      console.log("Interviewer already cached:", existingInterviewer);
      return;
    }
    
    // Online mode - get interviewer from Supabase
    if (isOnline()) {
      const { data: interviewers, error } = await supabase
        .from('interviewers')
        .select('*')
        .eq('code', interviewerCode)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (interviewers && interviewers.length > 0) {
        // Store interviewer in offline DB
        await db.interviewers.add({
          id: interviewers[0].id,
          code: interviewers[0].code,
          first_name: interviewers[0].first_name,
          last_name: interviewers[0].last_name,
          email: interviewers[0].email,
          phone: interviewers[0].phone,
          island: interviewers[0].island
        });
        
        console.log("Interviewer cached:", interviewers[0].code);
      }
    }
  } catch (error) {
    console.error("Error caching interviewer:", error);
  }
}

// Get interviewer by code
export async function getInterviewerByCode(interviewerCode: string) {
  try {
    // First check offline cache
    const cachedInterviewer = await db.interviewers.where('code').equals(interviewerCode).first();
    
    if (cachedInterviewer) {
      console.log("Using cached interviewer:", cachedInterviewer);
      return cachedInterviewer;
    }
    
    // If online and not in cache, try to get from Supabase
    if (isOnline()) {
      const { data: interviewers, error } = await supabase
        .from('interviewers')
        .select('*')
        .eq('code', interviewerCode)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (interviewers && interviewers.length > 0) {
        // Cache interviewer for future offline use
        await cacheInterviewer(interviewerCode);
        return {
          id: interviewers[0].id,
          code: interviewers[0].code,
          first_name: interviewers[0].first_name,
          last_name: interviewers[0].last_name,
          email: interviewers[0].email,
          phone: interviewers[0].phone,
          island: interviewers[0].island
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting interviewer by code:", error);
    return null;
  }
}

// Cache projects for offline use
export async function cacheProjects(projects: any[]) {
  try {
    // Clear existing projects and add new ones
    await db.projects.clear();
    
    for (const project of projects) {
      await db.projects.add({
        id: project.id,
        name: project.name,
        start_date: project.start_date,
        end_date: project.end_date,
        excluded_islands: project.excluded_islands
      });
    }
    
    console.log(`${projects.length} projects cached for offline use`);
  } catch (error) {
    console.error("Error caching projects:", error);
  }
}

// Get cached projects
export async function getCachedProjects() {
  try {
    const projects = await db.projects.toArray();
    return projects;
  } catch (error) {
    console.error("Error getting cached projects:", error);
    return [];
  }
}

// Save offline session
export async function saveOfflineSession(
  interviewerCode: string,
  projectId: string | null,
  startTime: string,
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | undefined
) {
  try {
    // Generate a unique UUID for this session
    const sessionUuid = uuidv4();
    
    // Create a new session record
    const id = await db.sessions.add({
      uuid: sessionUuid,
      interviewerCode,
      projectId,
      startTime,
      endTime: null,
      startLatitude: locationData?.latitude,
      startLongitude: locationData?.longitude,
      startAddress: locationData?.address,
      synced: false,
      syncInProgress: false,
      syncAttempts: 0,
      lastSyncAttempt: null,
      created: new Date().toISOString()
    });
    
    console.log(`Offline session ${id} (UUID: ${sessionUuid}) saved`);
    
    // Log the operation
    await logSync('OfflineSessionSave', 'Completed', 'success', `Offline session ${id} (UUID: ${sessionUuid}) saved`);
    
    return id;
  } catch (error) {
    console.error("Error saving offline session:", error);
    await logSync('OfflineSessionSave', 'Error', 'error', `Error saving offline session: ${error}`);
    throw error;
  }
}

// Update offline session
export async function updateOfflineSession(
  id: number,
  endTime: string,
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | undefined
) {
  try {
    // Get the session first
    const session = await db.sessions.get(id);
    if (!session) {
      throw new Error(`Session with ID ${id} not found`);
    }
    
    // Update the session
    await db.sessions.update(id, {
      endTime,
      endLatitude: locationData?.latitude || null,
      endLongitude: locationData?.longitude || null,
      endAddress: locationData?.address || null,
      synced: false,
      syncInProgress: false,
      syncAttempts: session.syncAttempts, // Keep existing attempts
      lastSyncAttempt: session.lastSyncAttempt // Keep existing timestamp
    });
    
    console.log(`Offline session ${id} updated with end time ${endTime}`);
    
    // Log the operation
    await logSync('OfflineSessionUpdate', 'Completed', 'success', `Offline session ${id} updated with end time`);
    
    return true;
  } catch (error) {
    console.error("Error updating offline session:", error);
    await logSync('OfflineSessionUpdate', 'Error', 'error', `Error updating offline session: ${error}`);
    return false;
  }
}

// Save offline interview
export async function saveOfflineInterview(
  sessionId: number,
  candidateName: string,
  projectId: string | null,
  startTime: string,
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | undefined
) {
  try {
    // Generate a unique UUID for this interview
    const interviewUuid = uuidv4();
    
    // Create a new interview record
    const id = await db.interviews.add({
      uuid: interviewUuid,
      sessionId,
      candidateName,
      projectId,
      startTime,
      endTime: null,
      startLatitude: locationData?.latitude,
      startLongitude: locationData?.longitude,
      startAddress: locationData?.address,
      result: null,
      synced: false,
      syncInProgress: false,
      syncAttempts: 0,
      lastSyncAttempt: null,
      created: new Date().toISOString()
    });
    
    console.log(`Offline interview ${id} (UUID: ${interviewUuid}) saved`);
    
    // Log the operation
    await logSync('OfflineInterviewSave', 'Completed', 'success', `Offline interview ${id} saved for session ${sessionId}`);
    
    return id;
  } catch (error) {
    console.error("Error saving offline interview:", error);
    await logSync('OfflineInterviewSave', 'Error', 'error', `Error saving offline interview: ${error}`);
    throw error;
  }
}

// Update offline interview with end details
export async function updateOfflineInterview(
  id: number,
  endTime: string,
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | undefined
) {
  try {
    // Get the interview first
    const interview = await db.interviews.get(id);
    if (!interview) {
      throw new Error(`Interview with ID ${id} not found`);
    }
    
    // Update the interview
    await db.interviews.update(id, {
      endTime,
      endLatitude: locationData?.latitude || null,
      endLongitude: locationData?.longitude || null,
      endAddress: locationData?.address || null,
      synced: false,
      syncInProgress: false,
      syncAttempts: interview.syncAttempts, // Keep existing attempts
      lastSyncAttempt: interview.lastSyncAttempt // Keep existing timestamp
    });
    
    console.log(`Offline interview ${id} updated with end time ${endTime}`);
    
    // Log the operation
    await logSync('OfflineInterviewUpdate', 'Completed', 'success', `Offline interview ${id} updated with end time`);
    
    return true;
  } catch (error) {
    console.error("Error updating offline interview:", error);
    await logSync('OfflineInterviewUpdate', 'Error', 'error', `Error updating offline interview: ${error}`);
    return false;
  }
}

// Update offline interview with result
export async function updateOfflineInterviewResult(
  id: number,
  result: 'response' | 'non-response'
) {
  try {
    // Get the interview first
    const interview = await db.interviews.get(id);
    if (!interview) {
      throw new Error(`Interview with ID ${id} not found`);
    }
    
    // Update the interview result
    await db.interviews.update(id, {
      result,
      synced: false,
      syncInProgress: false,
      syncAttempts: interview.syncAttempts, // Keep existing attempts
      lastSyncAttempt: interview.lastSyncAttempt // Keep existing timestamp
    });
    
    console.log(`Offline interview ${id} updated with result ${result}`);
    
    // Log the operation
    await logSync('OfflineInterviewResult', 'Completed', 'success', `Offline interview ${id} updated with result ${result}`);
    
    return true;
  } catch (error) {
    console.error("Error updating offline interview result:", error);
    await logSync('OfflineInterviewResult', 'Error', 'error', `Error updating offline interview result: ${error}`);
    return false;
  }
}

// Get offline interview
export async function getOfflineInterview(id: number) {
  try {
    const interview = await db.interviews.get(id);
    return interview;
  } catch (error) {
    console.error("Error getting offline interview:", error);
    return null;
  }
}

// Get interviews for offline session
export async function getInterviewsForOfflineSession(sessionId: number) {
  try {
    const interviews = await db.interviews.where('sessionId').equals(sessionId).toArray();
    return interviews;
  } catch (error) {
    console.error("Error getting interviews for offline session:", error);
    return [];
  }
}

// Count unsynced sessions
export async function getUnsyncedSessionsCount() {
  try {
    return await db.sessions.where('synced').equals(false).count();
  } catch (error) {
    console.error("Error counting unsynced sessions:", error);
    return 0;
  }
}

// Count unsynced interviews
export async function getUnsyncedInterviewsCount() {
  try {
    return await db.interviews.where('synced').equals(false).count();
  } catch (error) {
    console.error("Error counting unsynced interviews:", error);
    return 0;
  }
}

// Initialize sync lock
export async function initializeSyncLock() {
  try {
    const lock = await db.syncLock.get(1);
    
    if (!lock) {
      await db.syncLock.add({
        id: 1,
        isLocked: 0,
        lockedBy: '',
        timestamp: new Date().toISOString(),
        expiresAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error initializing sync lock:", error);
  }
}

// Call this on app startup
initializeSyncLock().catch(console.error);

// Acquire sync lock
export async function acquireSyncLock(lockId: string): Promise<boolean> {
  try {
    // Get current lock
    const currentLock = await db.syncLock.get(1);
    
    if (!currentLock) {
      // Initialize lock if it doesn't exist
      await initializeSyncLock();
      return await acquireSyncLock(lockId);
    }
    
    // Check if lock is already held
    const now = new Date();
    const expiresAt = new Date(currentLock.expiresAt);
    
    if (currentLock.isLocked === 1 && expiresAt > now && currentLock.lockedBy !== lockId) {
      console.log("Lock is already held by:", currentLock.lockedBy);
      return false;
    }
    
    // Set expiry to 5 minutes from now
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 5);
    
    // Acquire lock
    await db.syncLock.update(1, {
      isLocked: 1,
      lockedBy: lockId,
      timestamp: now.toISOString(),
      expiresAt: newExpiresAt.toISOString()
    });
    
    console.log("Lock acquired by:", lockId);
    await logSync('SyncLock', 'Completed', 'success', `Lock acquired by ${lockId}`);
    
    return true;
  } catch (error) {
    console.error("Error acquiring sync lock:", error);
    await logSync('SyncLock', 'Error', 'error', `Error acquiring lock: ${error}`);
    return false;
  }
}

// Release sync lock
export async function releaseSyncLock(lockId: string): Promise<boolean> {
  try {
    // Get current lock
    const currentLock = await db.syncLock.get(1);
    
    if (!currentLock) {
      return false;
    }
    
    // Only release if this is our lock
    if (currentLock.lockedBy === lockId || currentLock.lockedBy === '') {
      await db.syncLock.update(1, {
        isLocked: 0,
        lockedBy: '',
        timestamp: new Date().toISOString(),
        expiresAt: new Date().toISOString()
      });
      
      console.log("Lock released by:", lockId);
      await logSync('SyncLock', 'Completed', 'success', `Lock released by ${lockId}`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error releasing sync lock:", error);
    await logSync('SyncLock', 'Error', 'error', `Error releasing lock: ${error}`);
    return false;
  }
}

// Log sync operations
export async function logSync(
  operation: string,
  status: 'Started' | 'Completed' | 'Error',
  result: 'success' | 'error' | 'warning',
  message: string
) {
  try {
    await db.syncLog.add({
      operation,
      status,
      result,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error logging sync operation:", error);
  }
}

// Get sync status
export async function getSyncStatus() {
  try {
    // Get counts
    const sessionsTotal = await db.sessions.count();
    const sessionsUnsynced = await db.sessions.where('synced').equals(false).count();
    const sessionsInProgress = await db.sessions.where('syncInProgress').equals(true).count();
    
    const interviewsTotal = await db.interviews.count();
    const interviewsUnsynced = await db.interviews.where('synced').equals(false).count();
    const interviewsInProgress = await db.interviews.where('syncInProgress').equals(true).count();
    
    // Get last sync log
    const lastSyncLogs = await db.syncLog
      .where('operation')
      .equals('Sync')
      .reverse()
      .limit(1)
      .toArray();
    
    const lastSync = lastSyncLogs.length > 0 ? lastSyncLogs[0].timestamp : null;
    
    // Get current lock
    const currentLock = await db.syncLock.get(1);
    
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
}

// Sync offline sessions and interviews
export async function syncOfflineSessions(): Promise<boolean> {
  // Check if we're online
  if (!isOnline()) {
    console.log("Cannot sync while offline");
    return false;
  }
  
  // Log sync start
  await logSync('Sync', 'Started', 'success', 'Starting sync of offline data');
  
  try {
    // First sync sessions
    await syncSessions();
    
    // Then sync interviews
    await syncInterviews();
    
    // Log sync completion
    await logSync('Sync', 'Completed', 'success', 'Sync completed successfully');
    
    return true;
  } catch (error) {
    console.error("Error syncing offline data:", error);
    await logSync('Sync', 'Error', 'error', `Sync error: ${error}`);
    return false;
  }
}

// Sync sessions
async function syncSessions(): Promise<boolean> {
  try {
    // Get unsynced sessions that are not in progress
    const unsyncedSessions = await db.sessions
      .where('synced')
      .equals(false)
      .and(session => session.syncInProgress === false)
      .toArray();
    
    if (unsyncedSessions.length === 0) {
      console.log("No unsynced sessions to sync");
      return true;
    }
    
    console.log(`Found ${unsyncedSessions.length} unsynced sessions`);
    
    // Sort by created time (oldest first) - this helps maintain order
    unsyncedSessions.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
    
    // Process them one by one to avoid race conditions
    for (const session of unsyncedSessions) {
      await syncSingleSession(session);
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing sessions:", error);
    await logSync('SyncSessions', 'Error', 'error', `Error syncing sessions: ${error}`);
    return false;
  }
}

// Sync a single session
async function syncSingleSession(session: OfflineSession): Promise<boolean> {
  try {
    // Mark as in progress
    await db.sessions.update(session.id!, {
      syncInProgress: true,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Log session sync attempt
    const sessionLog = `Syncing session ${session.id} (UUID: ${session.uuid}), attempt #${session.syncAttempts + 1}`;
    console.log(sessionLog);
    await logSync('SyncSession', 'Started', 'success', sessionLog);
    
    // Check if session already exists by UUID
    const { data: existingSessions, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('interviewer_id', session.uuid)
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingSessions && existingSessions.length > 0) {
      // Session already exists, mark as synced
      console.log(`Session ${session.id} (UUID: ${session.uuid}) already exists in online DB with ID ${existingSessions[0].id}`);
      await logSync('SyncSession', 'Completed', 'warning', `Session ${session.id} already exists in online DB with ID ${existingSessions[0].id}`);
      
      await db.sessions.update(session.id!, {
        synced: true,
        syncInProgress: false,
        syncAttempts: session.syncAttempts + 1,
        lastSyncAttempt: new Date().toISOString()
      });
      
      // Let's also check if the session has any interviews that need to be synced
      const sessionInterviews = await db.interviews
        .where('sessionId')
        .equals(session.id!)
        .toArray();
      
      if (sessionInterviews.length > 0) {
        for (const interview of sessionInterviews) {
          // Update each interview to use the online session ID
          await db.interviews.update(interview.id!, {
            synced: false,
            syncInProgress: false
          });
        }
      }
      
      return true;
    }
    
    // Get interviewer ID from offline DB
    const interviewer = await getInterviewerByCode(session.interviewerCode);
    
    if (!interviewer) {
      throw new Error(`Interviewer with code ${session.interviewerCode} not found`);
    }
    
    // Prepare session data
    const sessionData = {
      id: session.uuid, // Use UUID as the online ID
      interviewer_id: interviewer.id,
      project_id: session.projectId,
      start_time: session.startTime,
      end_time: session.endTime,
      start_latitude: session.startLatitude,
      start_longitude: session.startLongitude,
      start_address: session.startAddress,
      end_latitude: session.endLatitude,
      end_longitude: session.endLongitude,
      end_address: session.endAddress,
      is_active: session.endTime === null
    };
    
    // Insert session into Supabase
    const { data, error } = await supabase
      .from('sessions')
      .upsert([sessionData], {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`Session ${session.id} (UUID: ${session.uuid}) synced successfully`);
    await logSync('SyncSession', 'Completed', 'success', `Session ${session.id} synced successfully`);
    
    // Mark as synced
    await db.sessions.update(session.id!, {
      synced: true,
      syncInProgress: false,
      syncAttempts: session.syncAttempts + 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Now sync any interviews associated with this session
    await syncInterviewsForSession(session.id!);
    
    return true;
  } catch (error) {
    console.error(`Error syncing session ${session.id}:`, error);
    await logSync('SyncSession', 'Error', 'error', `Error syncing session ${session.id}: ${error}`);
    
    // Mark as failed but not in progress
    await db.sessions.update(session.id!, {
      synced: false,
      syncInProgress: false,
      syncAttempts: session.syncAttempts + 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // If we've tried too many times, give up
    if (session.syncAttempts >= 5) {
      console.warn(`Giving up on syncing session ${session.id} after ${session.syncAttempts} attempts`);
      await logSync('SyncSession', 'Error', 'warning', `Giving up on syncing session ${session.id} after ${session.syncAttempts} attempts`);
      
      toast({
        title: "Sync Warning",
        description: `Could not sync session ${session.id} after multiple attempts.`,
        duration: 5000,
      });
    }
    
    return false;
  }
}

// Sync interviews
async function syncInterviews(): Promise<boolean> {
  try {
    // Get unsynced interviews that are not in progress
    // Only sync interviews for synced sessions
    const unsyncedInterviews = await db.interviews
      .where('synced')
      .equals(false)
      .and(interview => interview.syncInProgress === false)
      .toArray();
    
    if (unsyncedInterviews.length === 0) {
      console.log("No unsynced interviews to sync");
      return true;
    }
    
    console.log(`Found ${unsyncedInterviews.length} unsynced interviews`);
    
    // Sort by created time (oldest first)
    unsyncedInterviews.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
    
    // Process them one by one to avoid race conditions
    for (const interview of unsyncedInterviews) {
      // Get the associated session
      const session = await db.sessions.get(interview.sessionId);
      
      // Only sync if the session is synced or if this is a retry
      if (session && (session.synced || interview.syncAttempts > 0)) {
        await syncSingleInterview(interview, session);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing interviews:", error);
    await logSync('SyncInterviews', 'Error', 'error', `Error syncing interviews: ${error}`);
    return false;
  }
}

// Sync interviews for a specific session
async function syncInterviewsForSession(sessionId: number): Promise<boolean> {
  try {
    // Get unsynced interviews for this session
    const unsyncedInterviews = await db.interviews
      .where('sessionId')
      .equals(sessionId)
      .and(interview => !interview.synced)
      .toArray();
    
    if (unsyncedInterviews.length === 0) {
      console.log(`No unsynced interviews for session ${sessionId}`);
      return true;
    }
    
    console.log(`Found ${unsyncedInterviews.length} unsynced interviews for session ${sessionId}`);
    
    // Get the session
    const session = await db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Process each interview
    for (const interview of unsyncedInterviews) {
      await syncSingleInterview(interview, session);
    }
    
    return true;
  } catch (error) {
    console.error(`Error syncing interviews for session ${sessionId}:`, error);
    await logSync('SyncSessionInterviews', 'Error', 'error', `Error syncing interviews for session ${sessionId}: ${error}`);
    return false;
  }
}

// Sync a single interview
async function syncSingleInterview(interview: OfflineInterview, session: OfflineSession): Promise<boolean> {
  try {
    // Mark as in progress
    await db.interviews.update(interview.id!, {
      syncInProgress: true,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // Log interview sync attempt
    const interviewLog = `Syncing interview ${interview.id} (UUID: ${interview.uuid}), attempt #${interview.syncAttempts + 1}`;
    console.log(interviewLog);
    await logSync('SyncInterview', 'Started', 'success', interviewLog);
    
    // Check if already exists by UUID
    const { data: existingInterviews, error: checkError } = await supabase
      .from('interviews')
      .select('id')
      .eq('id', interview.uuid)
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingInterviews && existingInterviews.length > 0) {
      // Interview already exists, mark as synced
      console.log(`Interview ${interview.id} (UUID: ${interview.uuid}) already exists in online DB with ID ${existingInterviews[0].id}`);
      await logSync('SyncInterview', 'Completed', 'warning', `Interview ${interview.id} already exists in online DB with ID ${existingInterviews[0].id}`);
      
      await db.interviews.update(interview.id!, {
        synced: true,
        syncInProgress: false,
        syncAttempts: interview.syncAttempts + 1,
        lastSyncAttempt: new Date().toISOString()
      });
      
      return true;
    }
    
    // Prepare interview data
    const interviewData = {
      id: interview.uuid, // Use UUID as the online ID
      session_id: session.uuid, // Use session's UUID
      project_id: interview.projectId,
      candidate_name: interview.candidateName,
      start_time: interview.startTime,
      end_time: interview.endTime,
      start_latitude: interview.startLatitude,
      start_longitude: interview.startLongitude,
      start_address: interview.startAddress,
      end_latitude: interview.endLatitude,
      end_longitude: interview.endLongitude,
      end_address: interview.endAddress,
      result: interview.result,
      is_active: interview.endTime === null && interview.result === null
    };
    
    // Insert interview into Supabase
    const { data, error } = await supabase
      .from('interviews')
      .upsert([interviewData], {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`Interview ${interview.id} (UUID: ${interview.uuid}) synced successfully`);
    await logSync('SyncInterview', 'Completed', 'success', `Interview ${interview.id} synced successfully`);
    
    // Mark as synced
    await db.interviews.update(interview.id!, {
      synced: true,
      syncInProgress: false,
      syncAttempts: interview.syncAttempts + 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error(`Error syncing interview ${interview.id}:`, error);
    await logSync('SyncInterview', 'Error', 'error', `Error syncing interview ${interview.id}: ${error}`);
    
    // Mark as failed but not in progress
    await db.interviews.update(interview.id!, {
      synced: false,
      syncInProgress: false,
      syncAttempts: interview.syncAttempts + 1,
      lastSyncAttempt: new Date().toISOString()
    });
    
    // If we've tried too many times, give up
    if (interview.syncAttempts >= 5) {
      console.warn(`Giving up on syncing interview ${interview.id} after ${interview.syncAttempts} attempts`);
      await logSync('SyncInterview', 'Error', 'warning', `Giving up on syncing interview ${interview.id} after ${interview.syncAttempts} attempts`);
      
      toast({
        title: "Sync Warning",
        description: `Could not sync interview ${interview.id} after multiple attempts.`,
        duration: 5000,
      });
    }
    
    return false;
  }
}

// Clear sync lock on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => {
    // We can't use async here, but we can try to release the lock synchronously
    try {
      const lockId = 'unload-' + Date.now();
      db.syncLock.update(1, {
        isLocked: 0,
        lockedBy: '',
        timestamp: new Date().toISOString(),
        expiresAt: new Date().toISOString()
      });
      console.log("Lock released on page unload");
    } catch (e) {
      console.error("Error releasing lock on unload:", e);
    }
  });
}

// Initialize any pending data
if (typeof window !== 'undefined') {
  // Clear any stuck sync in progress flags
  setTimeout(async () => {
    try {
      await db.sessions.where('syncInProgress').equals(true).modify({ syncInProgress: false });
      await db.interviews.where('syncInProgress').equals(true).modify({ syncInProgress: false });
      console.log("Reset stuck sync in progress flags");
    } catch (e) {
      console.error("Error resetting sync flags:", e);
    }
  }, 2000);
}

// Export all functions
export {
  db,
}

