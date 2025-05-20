
import { db, LocationData } from './db';

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

// Function to get unsynced sessions count
export async function getUnsyncedSessionsCount(): Promise<number> {
  try {
    // Using 1 as a truthy value instead of a boolean
    const count = await db.sessions.where('is_active').equals(1).count();
    return count;
  } catch (error) {
    console.error('[OfflineDB] Error getting unsynced sessions count:', error);
    return 0;
  }
}
