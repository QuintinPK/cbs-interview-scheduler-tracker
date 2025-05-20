
import { db, LocationData } from './db';

// Define the structure for interview save options
export interface SaveInterviewOptions {
  sessionId: number;
  candidateName: string;
  projectId: string | null;
  startTime: string;
  location: LocationData | null;
  id?: number; // Optional ID for updates
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
