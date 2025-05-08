
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
  synced: number; // Changed from boolean to number (0 = false, 1 = true)
}

// Create a Dexie database class
class OfflineDatabase extends Dexie {
  sessions!: Table<OfflineSession>;

  constructor() {
    super('offlineSessionsDB');
    this.version(1).stores({
      sessions: '++id, interviewerCode, startTime, synced'
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
      synced: 0 // Using 0 instead of false
    });
    
    console.log("Session saved locally:", id);
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
  } catch (error) {
    console.error("Error updating offline session:", error);
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
      .equals(0) // Using 0 instead of false
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
        
        const { error: insertError } = await supabase
          .from('sessions')
          .insert([sessionData]);
          
        if (insertError) {
          console.error("Error syncing session to server:", insertError);
          continue;
        }
        
        // Mark as synced in local DB
        await offlineDB.sessions.update(session.id!, { synced: 1 }); // Using 1 instead of true
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

// Get the count of unsynced sessions
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    return await offlineDB.sessions
      .where('synced')
      .equals(0) // Using 0 instead of false
      .count();
  } catch (error) {
    console.error("Error counting unsynced sessions:", error);
    return 0;
  }
};
