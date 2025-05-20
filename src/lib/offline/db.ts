
import Dexie from 'dexie';

// Define the basic database structure
class OfflineDB extends Dexie {
  sessions: Dexie.Table<any, number>;
  interviews: Dexie.Table<any, number>;
  syncLog: Dexie.Table<any, number>;
  interviewers: Dexie.Table<any, string>;
  projects: Dexie.Table<any, string>;

  constructor() {
    super('OfflineDB');
    this.version(1).stores({
      sessions: '++id, interviewerId, projectId, startTime, endTime, startLatitude, startLongitude, startAddress, endLatitude, endLongitude, endAddress, is_active',
      interviews: '++id, sessionId, candidateName, projectId, startTime, endTime, startLatitude, startLongitude, startAddress, endLatitude, endLongitude, endAddress, result',
      syncLog: '++id, syncType, status, message, timestamp',
      interviewers: 'id, code, name',
      projects: 'id, name, start_date, end_date'
    });
    this.sessions = this.table('sessions');
    this.interviews = this.table('interviews');
    this.syncLog = this.table('syncLog');
    this.interviewers = this.table('interviewers');
    this.projects = this.table('projects');
  }
}

// Create a singleton instance
export const db = new OfflineDB();

// Helper function to check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Common interfaces
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Interviewer {
  id: string;
  code: string;
  name?: string;
}

export interface Project {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
}
