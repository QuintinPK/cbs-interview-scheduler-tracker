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

// Create a Dexie database class
class OfflineDatabase extends Dexie {
  interviewers!: Table<OfflineInterviewer>;
  sessions!: Table<OfflineSession>;
  interviews!: Table<OfflineInterview>;
  projects!: Table<OfflineProject>;

  constructor() {
    super('offlineSessionsDB');
    
    // Update the database schema to include all tables we need
    this.version(3).stores({
      interviewers: '++id, code',
      sessions: '++id, interviewerCode, startTime, synced, supabaseId',
      interviews: '++id, sessionId, startTime, endTime, synced, supabaseSessionId',
      projects: 'id, name'
    });
  }
}

// Create a singleton instance
export const offlineDB = new OfflineDatabase();

// Check if a network connection is available
export const isOnline = (): boolean => {
  return navigator.onLine;
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
    console.log("Updating offline session with end location:", endLocation);
    
    // If no location provided, try to get it
    if (!endLocation) {
      try {
        endLocation = await getCurrentLocation({ highAccuracy: true, timeout: 5000 });
        console.log("Got location for offline session end:", endLocation);
      } catch (err) {
        console.error("Could not get location for session end:", err);
      }
    }
    
    const updateData: Partial<OfflineSession> = {
      endTime
    };
    
    // Only add location data if we have it
    if (endLocation) {
      updateData.endLatitude = endLocation.latitude;
      updateData.endLongitude = endLocation.longitude;
      updateData.endAddress = endLocation.address || null;
    }
    
    await offlineDB.sessions.update(id, updateData);
    
    console.log("Offline session updated with end details:", id, updateData);
    
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

// Synchronize offline sessions with the server - now with duplicate prevention
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
    
    // Create a set to track already synced sessions by their unique identifiers
    // Use a composite key of interviewerCode + startTime to detect duplicates
    const syncedSessionIdentifiers = new Set();
    
    for (const session of unsyncedSessions) {
      try {
        // Create a unique identifier for this session
        const sessionUniqueKey = `${session.interviewerCode}_${session.startTime}`;
        
        // Skip if we've already synced a session with this key in the current batch
        if (syncedSessionIdentifiers.has(sessionUniqueKey)) {
          console.log(`Skipping duplicate session: ${sessionUniqueKey}`);
          // Mark as synced to avoid future sync attempts
          await offlineDB.sessions.update(session.id!, { synced: 1 });
          continue;
        }
        
        // First get the interviewer ID from the code
        const cachedInterviewer = await getInterviewerByCode(session.interviewerCode);
        
        if (!cachedInterviewer) {
          console.error("Could not find interviewer with code:", session.interviewerCode);
          continue;
        }
        
        const interviewerId = cachedInterviewer.id;
        
        // Check if this session already exists in Supabase by querying with the natural key
        const { data: existingSessions, error: checkError } = await supabase
          .from('sessions')
          .select('id')
          .eq('interviewer_id', interviewerId)
          .eq('start_time', session.startTime);
          
        // Handle project_id separately since it could be null
        const query = session.projectId === null 
          ? await supabase
              .from('sessions')
              .select('id')
              .eq('interviewer_id', interviewerId)
              .eq('start_time', session.startTime)
              .is('project_id', null)
          : await supabase
              .from('sessions')
              .select('id')
              .eq('interviewer_id', interviewerId)
              .eq('start_time', session.startTime)
              .eq('project_id', session.projectId);
        
        const existingSessionsWithProject = query.data;
        const checkErrorWithProject = query.error;
        
        if (checkError || checkErrorWithProject) {
          console.error("Error checking for existing session:", checkError || checkErrorWithProject);
          continue;
        }
        
        let supabaseSessionId = null;
        
        // If session already exists in Supabase, use that instead of creating a new one
        if ((existingSessions && existingSessions.length > 0) || 
            (existingSessionsWithProject && existingSessionsWithProject.length > 0)) {
          console.log("Found existing session in Supabase, using that instead of creating a new one");
          supabaseSessionId = (existingSessionsWithProject && existingSessionsWithProject.length > 0) 
            ? existingSessionsWithProject[0].id 
            : existingSessions[0].id;
          
          // Update the existing session with any end details if needed
          if (session.endTime) {
            await supabase
              .from('sessions')
              .update({
                end_time: session.endTime,
                end_latitude: session.endLatitude,
                end_longitude: session.endLongitude,
                end_address: session.endAddress,
                is_active: false
              })
              .eq('id', supabaseSessionId);
          }
        } else {
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
          
          supabaseSessionId = supabaseSession.id;
        }
        
        // Store the Supabase session ID in the local session
        await offlineDB.sessions.update(session.id!, { 
          synced: 1, 
          supabaseId: supabaseSessionId 
        });
        
        // Now sync any interviews associated with this session
        await syncInterviewsForSession(session.id!, supabaseSessionId);
        
        // Add to our set of synced sessions
        syncedSessionIdentifiers.add(sessionUniqueKey);
        
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
