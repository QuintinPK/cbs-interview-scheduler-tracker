
import { offlineDatabase } from './db';

export interface Interviewer {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  island?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
  hourly_rate?: number;
  response_rate?: number;
  non_response_rate?: number;
  show_response_rates?: boolean;
}

// Cache interviewer data
export async function cacheInterviewer(interviewer: Interviewer): Promise<void> {
  try {
    await offlineDatabase.interviewers.put(interviewer);
    console.log(`[OfflineDB] Cached interviewer: ${interviewer.code}`);
  } catch (error) {
    console.error('[OfflineDB] Error caching interviewer:', error);
    throw error;
  }
}

// Get interviewer by code
export async function getInterviewerByCode(code: string): Promise<Interviewer | undefined> {
  try {
    return await offlineDatabase.interviewers.where('code').equals(code).first();
  } catch (error) {
    console.error('[OfflineDB] Error getting interviewer by code:', error);
    throw error;
  }
}

// Cache multiple projects
export async function cacheProjects(projects: Project[]): Promise<void> {
  try {
    await offlineDatabase.projects.bulkPut(projects);
    console.log(`[OfflineDB] Cached ${projects.length} projects`);
  } catch (error) {
    console.error('[OfflineDB] Error caching projects:', error);
    throw error;
  }
}

// Get all cached projects
export async function getCachedProjects(): Promise<Project[]> {
  try {
    return await offlineDatabase.projects.toArray();
  } catch (error) {
    console.error('[OfflineDB] Error getting cached projects:', error);
    throw error;
  }
}
