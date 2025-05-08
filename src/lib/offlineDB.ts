
import Dexie, { Table } from 'dexie';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Location } from '@/types';

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

// Create a Dexie database class
class OfflineDatabase extends Dexie {
  sessions!: Table<OfflineSession>;
  interviews!: Table<OfflineInterview>;

  constructor() {
    super('offlineSessionsDB');
    this.version(1).stores({
      sessions: '++id, interviewerCode, startTime, synced'
    });
    
    // Update the database schema to include interviews
    this.version(2).stores({
      sessions: '++id, interviewerCode, startTime, synced, supabaseId',
      interviews: '++id, sessionId, startTime, endTime, synced, supabaseSessionId'
    });
  }
}

// Create a singleton instance
export const offlineDB = new OfflineDatabase();

// Save a session to the offline database
export const saveOfflineSession = async (
  interviewerCode: string, 
  projectId: string | null, 
  startTime: string, 
  startLocation?: Location
): Promise<number> => {
  try {
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
      synced: 0, // Using 0 instead of false
      supabaseId: null
    });
    
    console.log("Session saved locally:", id);
    
    // Try to register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is available
        if (registration.sync) {
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
    await offlineDB.sessions.update(id, {
      endTime,
      endLatitude: endLocation?.latitude || null,
      endLongitude: endLocation?.longitude || null,
      endAddress: endLocation?.address || null
    });
    
    console.log("Offline session updated:", id);
    
    // Try to register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is available
        if (registration.sync) {
          await registration.sync.register('sync-sessions');
        } else {
          console.log('Background sync not available');
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

// Check if a network connection is available
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Synchronize offline sessions with the server
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isOnline()) {
    return false;
  }

  try {
    // Get all unsynced sessions
    const unsyncedSessions = await offlineDB.sessions
      .where('synced')
      .equals(0)
      .toArray();
      
    if (unsyncedSessions.length === 0) {
      return true;
    }
    
    console.log(`Attempting to sync ${unsyncedSessions.length} offline sessions...`);
    
    let syncedCount = 0;
    
    for (const session of unsyncedSessions) {
      try {
        // First get the interviewer ID from the code
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', session.interviewerCode)
          .limit(1);
          
        if (interviewerError || !interviewers || interviewers.length === 0) {
          console.error("Could not find interviewer with code:", session.interviewerCode);
          continue;
        }
        
        const interviewerId = interviewers[0].id;
        
        // Create session in Supabase
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
          continue;
        }
        
        // Store the Supabase session ID in the local session
        await offlineDB.sessions.update(session.id!, { 
          synced: 1, 
          supabaseId: supabaseSession.id 
        });
        
        // Now sync any interviews associated with this session
        await syncInterviewsForSession(session.id!, supabaseSession.id);
        
        syncedCount++;
        
      } catch (error) {
        console.error("Error syncing individual session:", error);
        // Continue with next session
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
