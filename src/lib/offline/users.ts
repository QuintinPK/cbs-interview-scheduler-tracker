
import { db, Interviewer, Project, isOnline } from './db';

// Function to cache an interviewer for offline use
export async function cacheInterviewer(code: string, name?: string, id?: string): Promise<boolean> {
  try {
    // Check if we're online to fetch from Supabase
    if (isOnline()) {
      // Here you would normally fetch from Supabase
      // For now, just create a mock interviewer
      const interviewer = {
        id: id || `offline-${code}`,
        code: code,
        name: name || `Interviewer ${code}`
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
      await cacheInterviewer(code, `Interviewer ${code}`);
      
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
