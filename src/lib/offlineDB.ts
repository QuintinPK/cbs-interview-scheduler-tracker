
import { v4 as uuidv4 } from 'uuid';
import { Session, Interview, Location, Project } from "@/types";
import { supabaseSync } from "@/integrations/supabase/client";

// Setup IndexedDB database
const DB_NAME = 'cbs_offline_db';
const DB_VERSION = 4;

// Database schema
const STORES = {
  sessions: 'sessions',
  interviews: 'interviews',
  interviewers: 'interviewers',
  projects: 'projects',
  syncLocks: 'syncLocks',
  syncLogs: 'syncLogs',
  syncQueue: 'syncQueue' // Added for improved sync queueing
};

// Define status types
export type SyncLogStatus = 'success' | 'error' | 'warning';

// Define SyncLog interface
interface SyncLog {
  id?: number;
  timestamp: string;
  category: string;
  operation: string;
  status: SyncLogStatus;
  details: string;
  metadata?: {
    deviceId: string;
    isOnline: boolean;
    userAgent: string;
  };
}

// Define local session interface
interface OfflineSession {
  id?: number;
  interviewerCode: string;
  projectId: string | null;
  startTime: string;
  endTime?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  synced: boolean;
  isActive: boolean;
  uniqueKey: string;
  createdAt: string;
  updatedAt: string;
  onlineId?: string;
  syncedAt?: string;
}

// Define local interview interface
interface OfflineInterview {
  id?: number;
  sessionId: number;
  candidateName: string;
  projectId: string | null;
  startTime: string;
  endTime?: string | null;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  result?: string | null;
  synced: boolean;
  uniqueKey: string;
  createdAt: string;
  updatedAt: string;
  onlineId?: string;
  syncedAt?: string;
}

// Define SyncStatus interface
export interface SyncStatusData {
  sessionsTotal: number;
  sessionsUnsynced: number;
  sessionsInProgress: number;
  interviewsTotal: number;
  interviewsUnsynced: number;
  interviewsInProgress: number;
  lastSync: string | null;
  currentLock: {
    isLocked: number;
    lockedBy: string;
    lockedAt: number;
    expiresAt: number;
  } | null;
}

// Define simple result interfaces for database queries to avoid excessive type instantiation
interface SessionResult {
  id: string;
}

interface InterviewResult {
  id: string;
}

// Define simple database response type to avoid type recursion
interface SupabaseDatabaseResponse<T> {
  data: T | null;
  error: any | null;
}

// Check if offline/online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject(new Error('Could not open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.sessions)) {
        const sessionsStore = db.createObjectStore(STORES.sessions, { keyPath: 'id', autoIncrement: true });
        sessionsStore.createIndex('interviewerCode', 'interviewerCode', { unique: false });
        sessionsStore.createIndex('synced', 'synced', { unique: false });
        sessionsStore.createIndex('uniqueKey', 'uniqueKey', { unique: true });
        sessionsStore.createIndex('startTime', 'startTime', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.interviews)) {
        const interviewsStore = db.createObjectStore(STORES.interviews, { keyPath: 'id', autoIncrement: true });
        interviewsStore.createIndex('sessionId', 'sessionId', { unique: false });
        interviewsStore.createIndex('synced', 'synced', { unique: false });
        interviewsStore.createIndex('startTime', 'startTime', { unique: false });
        interviewsStore.createIndex('uniqueKey', 'uniqueKey', { unique: true });
      }
      
      if (!db.objectStoreNames.contains(STORES.interviewers)) {
        const interviewersStore = db.createObjectStore(STORES.interviewers, { keyPath: 'code' });
      }
      
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const projectsStore = db.createObjectStore(STORES.projects, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.syncLocks)) {
        const syncLocksStore = db.createObjectStore(STORES.syncLocks, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.syncLogs)) {
        const syncLogsStore = db.createObjectStore(STORES.syncLogs, { keyPath: 'id', autoIncrement: true });
        syncLogsStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncLogsStore.createIndex('category', 'category', { unique: false });
        syncLogsStore.createIndex('status', 'status', { unique: false });
      }
      
      // Add new sync queue store for improved sync operations
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const syncQueueStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
        syncQueueStore.createIndex('type', 'type', { unique: false });
        syncQueueStore.createIndex('status', 'status', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncQueueStore.createIndex('priority', 'priority', { unique: false });
      }
      
      // Add migration to ensure existing sessions and interviews have uniqueKey
      if (db.objectStoreNames.contains(STORES.sessions)) {
        try {
          const existingSessionsRequest = db.transaction(STORES.sessions, 'readwrite')
            .objectStore(STORES.sessions)
            .openCursor();
          
          existingSessionsRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const session = cursor.value;
              if (!session.uniqueKey) {
                session.uniqueKey = generateSessionUniqueKey(session);
                cursor.update(session);
              }
              cursor.continue();
            }
          };
        } catch (e) {
          console.error("Error during session migration:", e);
        }
      }
      
      if (db.objectStoreNames.contains(STORES.interviews)) {
        try {
          const existingInterviewsRequest = db.transaction(STORES.interviews, 'readwrite')
            .objectStore(STORES.interviews)
            .openCursor();
          
          existingInterviewsRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              const interview = cursor.value;
              if (!interview.uniqueKey) {
                interview.uniqueKey = generateInterviewUniqueKey(interview);
                cursor.update(interview);
              }
              cursor.continue();
            }
          };
        } catch (e) {
          console.error("Error during interview migration:", e);
        }
      }
      
      console.log(`IndexedDB upgraded to version ${DB_VERSION}`);
    };
  });
};

// Generate a unique key for sessions to prevent duplicates during sync
export const generateSessionUniqueKey = (session: any): string => {
  // Enhanced uniqueness factors
  const interviewerCode = session.interviewerCode || 'unknown';
  const startTime = session.startTime || new Date().toISOString();
  const deviceId = localStorage.getItem('device_id') || 'unknown';
  const randomFactor = Math.random().toString(36).substring(2, 10);
  
  // Generate a UUID-based hash that combines all these factors
  return `${interviewerCode}-${startTime}-${deviceId}-${randomFactor}`;
};

// Generate a unique key for interviews
export const generateInterviewUniqueKey = (interview: any): string => {
  const sessionId = interview.sessionId || 'unknown';
  const startTime = interview.startTime || new Date().toISOString();
  const deviceId = localStorage.getItem('device_id') || 'unknown';
  const randomFactor = Math.random().toString(36).substring(2, 10);
  
  return `${sessionId}-${startTime}-${deviceId}-${randomFactor}`;
};

// Initialize device ID if not exists
export const initializeDeviceId = (): void => {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('device_id')) {
      localStorage.setItem('device_id', uuidv4());
      console.log('Device ID initialized');
    }
  }
};

// Call initialization on module load
initializeDeviceId();

// Save session to offline storage
export const saveOfflineSession = async (
  interviewerCode: string,
  projectId: string | null,
  startTime: string,
  locationData?: Location
): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readwrite');
    const store = transaction.objectStore(STORES.sessions);
    
    const session = {
      interviewerCode,
      projectId,
      startTime,
      startLatitude: locationData?.latitude,
      startLongitude: locationData?.longitude,
      startAddress: locationData?.address,
      synced: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Generate a unique key for this session
    session['uniqueKey'] = generateSessionUniqueKey(session);
    
    // Log the session creation
    await logSync('SessionCreation', 'Created', 'success', 
      `Created offline session for interviewer ${interviewerCode}`);
    
    return new Promise((resolve, reject) => {
      const request = store.add(session);
      
      request.onsuccess = () => {
        const sessionId = request.result as number;
        console.log('Saved offline session with ID:', sessionId);
        resolve(sessionId);
      };
      
      request.onerror = (error) => {
        console.error('Error saving offline session:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error saving offline session:', error);
    throw error;
  }
};

// Update offline session with end details
export const updateOfflineSession = async (
  sessionId: number,
  endTime?: string,
  locationData?: Location
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readwrite');
    const store = transaction.objectStore(STORES.sessions);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      
      request.onsuccess = async () => {
        const session = request.result;
        
        if (!session) {
          reject(new Error(`Session with ID ${sessionId} not found`));
          return;
        }
        
        if (endTime) {
          session.endTime = endTime;
          session.isActive = false;
        }
        
        if (locationData) {
          session.endLatitude = locationData.latitude;
          session.endLongitude = locationData.longitude;
          session.endAddress = locationData.address;
        }
        
        session.updatedAt = new Date().toISOString();
        
        const updateRequest = store.put(session);
        
        updateRequest.onsuccess = () => {
          console.log('Updated offline session:', sessionId);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error('Error updating offline session:', error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error fetching session for update:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error updating offline session:', error);
    throw error;
  }
};

// Save an interview to offline storage
export const saveOfflineInterview = async (
  sessionId: number,
  candidateName: string,
  projectId: string | null,
  startTime: string,
  locationData?: Location
): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readwrite');
    const store = transaction.objectStore(STORES.interviews);
    
    const interview = {
      sessionId,
      candidateName,
      projectId,
      startTime,
      startLatitude: locationData?.latitude,
      startLongitude: locationData?.longitude,
      startAddress: locationData?.address,
      synced: false,
      endTime: null,
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Generate a unique key for this interview
    interview['uniqueKey'] = generateInterviewUniqueKey(interview);
    
    return new Promise((resolve, reject) => {
      const request = store.add(interview);
      
      request.onsuccess = () => {
        const interviewId = request.result as number;
        console.log('Saved offline interview with ID:', interviewId);
        resolve(interviewId);
      };
      
      request.onerror = (error) => {
        console.error('Error saving offline interview:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error saving offline interview:', error);
    throw error;
  }
};

// Update offline interview with end details or result
export const updateOfflineInterview = async (
  interviewId: number,
  endTime?: string,
  locationData?: Location,
  result?: string
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readwrite');
    const store = transaction.objectStore(STORES.interviews);
    
    return new Promise((resolve, reject) => {
      const request = store.get(interviewId);
      
      request.onsuccess = async () => {
        const interview = request.result;
        
        if (!interview) {
          reject(new Error(`Interview with ID ${interviewId} not found`));
          return;
        }
        
        if (endTime) {
          interview.endTime = endTime;
        }
        
        if (locationData) {
          interview.endLatitude = locationData.latitude;
          interview.endLongitude = locationData.longitude;
          interview.endAddress = locationData.address;
        }
        
        if (result !== undefined) {
          interview.result = result;
        }
        
        interview.updatedAt = new Date().toISOString();
        
        const updateRequest = store.put(interview);
        
        updateRequest.onsuccess = () => {
          console.log('Updated offline interview:', interviewId);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error('Error updating offline interview:', error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error fetching interview for update:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error updating offline interview:', error);
    throw error;
  }
};

// Alias for updateOfflineInterview focused on just updating the result
export const updateOfflineInterviewResult = async (
  interviewId: number, 
  result: string
): Promise<void> => {
  return updateOfflineInterview(interviewId, undefined, undefined, result);
};

// Get all unsynchronized sessions
export const getUnsyncedSessions = async (): Promise<OfflineSession[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    const index = store.index('synced');
    
    // Fix for the excessive type instantiation error by explicitly typing the Promise
    return new Promise<OfflineSession[]>((resolve, reject) => {
      // Use IDBKeyRange.only for boolean values
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (error) => {
        console.error('Error getting unsynced sessions:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error getting unsynced sessions:', error);
    return [];
  }
};

// Get the count of unsynchronized sessions
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    const index = store.index('synced');
    
    // Fix for the excessive type instantiation error by explicitly typing the Promise
    return new Promise<number>((resolve, reject) => {
      // Use IDBKeyRange.only for boolean values
      const request = index.count(IDBKeyRange.only(false));
      
      request.onsuccess = () => {
        resolve(request.result || 0);
      };
      
      request.onerror = (error) => {
        console.error('Error counting unsynced sessions:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error counting unsynced sessions:', error);
    return 0;
  }
};

// Get all unsynchronized interviews
export const getUnsyncedInterviews = async (): Promise<OfflineInterview[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    const index = store.index('synced');
    
    return new Promise<OfflineInterview[]>((resolve, reject) => {
      // Use IDBKeyRange.only for boolean values
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (error) => {
        console.error('Error getting unsynced interviews:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error getting unsynced interviews:', error);
    return [];
  }
};

// Get the count of unsynchronized interviews
export const getUnsyncedInterviewsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      // Use IDBKeyRange.only for boolean values
      const request = index.count(IDBKeyRange.only(false));
      
      request.onsuccess = () => {
        resolve(request.result || 0);
      };
      
      request.onerror = (error) => {
        console.error('Error counting unsynced interviews:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error counting unsynced interviews:', error);
    return 0;
  }
};

// Get interviews for a specific offline session
export const getInterviewsForOfflineSession = async (sessionId: number): Promise<OfflineInterview[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    const index = store.index('sessionId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (error) => {
        console.error(`Error getting interviews for session ${sessionId}:`, error);
        reject(error);
      };
    });
  } catch (error) {
    console.error(`Fatal error getting interviews for session ${sessionId}:`, error);
    return [];
  }
};

// Get a specific offline interview
export const getOfflineInterview = async (interviewId: number): Promise<OfflineInterview | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    
    return new Promise((resolve, reject) => {
      const request = store.get(interviewId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (error) => {
        console.error(`Error getting interview ${interviewId}:`, error);
        reject(error);
      };
    });
  } catch (error) {
    console.error(`Fatal error getting interview ${interviewId}:`, error);
    return null;
  }
};

// Mark a session as synced
export const markSessionAsSynced = async (sessionId: number, onlineId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readwrite');
    const store = transaction.objectStore(STORES.sessions);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      
      request.onsuccess = async () => {
        const session = request.result as OfflineSession;
        
        if (!session) {
          reject(new Error(`Session with ID ${sessionId} not found`));
          return;
        }
        
        session.synced = true;
        session.onlineId = onlineId;
        session.syncedAt = new Date().toISOString();
        
        const updateRequest = store.put(session);
        
        updateRequest.onsuccess = () => {
          console.log('Marked session as synced:', sessionId, 'Online ID:', onlineId);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error('Error marking session as synced:', error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error fetching session for marking as synced:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error marking session as synced:', error);
    throw error;
  }
};

// Mark an interview as synced
export const markInterviewAsSynced = async (interviewId: number, onlineId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readwrite');
    const store = transaction.objectStore(STORES.interviews);
    
    return new Promise((resolve, reject) => {
      const request = store.get(interviewId);
      
      request.onsuccess = async () => {
        const interview = request.result as OfflineInterview;
        
        if (!interview) {
          reject(new Error(`Interview with ID ${interviewId} not found`));
          return;
        }
        
        interview.synced = true;
        interview.onlineId = onlineId;
        interview.syncedAt = new Date().toISOString();
        
        const updateRequest = store.put(interview);
        
        updateRequest.onsuccess = () => {
          console.log('Marked interview as synced:', interviewId, 'Online ID:', onlineId);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error('Error marking interview as synced:', error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error fetching interview for marking as synced:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error marking interview as synced:', error);
    throw error;
  }
};

// Cache an interviewer locally for offline use
export const cacheInterviewer = async (interviewerCode: string): Promise<boolean> => {
  try {
    if (!interviewerCode) return false;
    
    const db = await openDB();
    
    // First check if the interviewer is already cached
    const existsTransaction = db.transaction([STORES.interviewers], 'readonly');
    const existsStore = existsTransaction.objectStore(STORES.interviewers);
    
    return new Promise(async (resolve, reject) => {
      const existsRequest = existsStore.get(interviewerCode);
      
      existsRequest.onsuccess = async () => {
        // If interviewer is already cached, no need to do anything
        if (existsRequest.result) {
          console.log('Interviewer already cached:', interviewerCode);
          resolve(true);
          return;
        }
        
        // If we're offline, we can't fetch the interviewer from the server
        if (!isOnline()) {
          console.log('Cannot cache interviewer while offline');
          resolve(false);
          return;
        }
        
        // If we're online, fetch the interviewer from the server
        try {
          const response = await supabaseSync
            .from('interviewers')
            .select('*')
            .eq('code', interviewerCode)
            .limit(1);
            
          const { data: interviewers, error } = response;
            
          if (error) {
            throw error;
          }
          
          if (!interviewers || interviewers.length === 0) {
            console.warn('Interviewer not found for caching:', interviewerCode);
            resolve(false);
            return;
          }
          
          const interviewer = interviewers[0];
          
          // Store in cache
          const saveTransaction = db.transaction([STORES.interviewers], 'readwrite');
          const saveStore = saveTransaction.objectStore(STORES.interviewers);
          
          const saveRequest = saveStore.put({
            ...interviewer,
            lastCached: new Date().toISOString()
          });
          
          saveRequest.onsuccess = () => {
            console.log('Cached interviewer:', interviewerCode);
            resolve(true);
          };
          
          saveRequest.onerror = (error) => {
            console.error('Error caching interviewer:', error);
            resolve(false);
          };
        } catch (error) {
          console.error('Error fetching interviewer for caching:', error);
          resolve(false);
        }
      };
      
      existsRequest.onerror = (error) => {
        console.error('Error checking if interviewer is cached:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error caching interviewer:', error);
    return false;
  }
};

// Get an interviewer by code (from cache or server)
export const getInterviewerByCode = async (interviewerCode: string): Promise<any | null> => {
  try {
    if (!interviewerCode) return null;
    
    // Try to get from cache first
    const db = await openDB();
    const transaction = db.transaction([STORES.interviewers], 'readonly');
    const store = transaction.objectStore(STORES.interviewers);
    
    return new Promise(async (resolve, reject) => {
      const request = store.get(interviewerCode);
      
      request.onsuccess = async () => {
        // If found in cache, return it
        if (request.result) {
          console.log('Found interviewer in cache:', interviewerCode);
          resolve(request.result);
          return;
        }
        
        // If not found in cache and we're offline, we can't fetch it
        if (!isOnline()) {
          console.log('Interviewer not in cache and offline:', interviewerCode);
          resolve(null);
          return;
        }
        
        // If we're online, fetch from server and cache it
        try {
          const response = await supabaseSync
            .from('interviewers')
            .select('*')
            .eq('code', interviewerCode)
            .limit(1);
            
          const { data: interviewers, error } = response;
            
          if (error) {
            throw error;
          }
          
          if (!interviewers || interviewers.length === 0) {
            console.warn('Interviewer not found:', interviewerCode);
            resolve(null);
            return;
          }
          
          const interviewer = interviewers[0];
          
          // Cache for future use
          await cacheInterviewer(interviewerCode);
          
          resolve(interviewer);
        } catch (error) {
          console.error('Error fetching interviewer:', error);
          resolve(null);
        }
      };
      
      request.onerror = (error) => {
        console.error('Error getting interviewer from cache:', error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Fatal error getting interviewer:', error);
    return null;
  }
};

// Cache projects for offline use
export const cacheProjects = async (projects: Project[]): Promise<boolean> => {
  try {
    if (!projects || projects.length === 0) return false;
    
    const db = await openDB();
    const transaction = db.transaction([STORES.projects], 'readwrite');
    const store = transaction.objectStore(STORES.projects);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      let failed = 0;
      
      projects.forEach((project) => {
        const request = store.put({
          ...project,
          lastCached: new Date().toISOString()
        });
        
        request.onsuccess = () => {
          completed++;
          if (completed + failed === projects.length) {
            console.log(`Cached ${completed}/${projects.length} projects`);
            resolve(completed === projects.length);
          }
        };
        
        request.onerror = (error) => {
          console.error('Error caching project:', error);
          failed++;
          if (completed + failed === projects.length) {
            console.log(`Cached ${completed}/${projects.length} projects`);
            resolve(completed === projects.length);
          }
        };
      });
    });
  } catch (error) {
    console.error('Fatal error caching projects:', error);
    return false;
  }
};

// Get cached projects
export const getCachedProjects = async (): Promise<Project[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.projects], 'readonly');
    const store = transaction.objectStore(STORES.projects);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (error) => {
        console.error('Error getting cached projects:', error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Fatal error getting cached projects:', error);
    return [];
  }
};

// Check if a session already exists online by its uniqueKey
export const checkSessionExists = async (uniqueKey: string): Promise<string | null> => {
  if (!isOnline()) return null;
  
  try {
    // Get the URL and anon key from the imported supabase client instance
    const SUPABASE_URL = "https://jljhtvfrkxehvdvhfktv.supabase.co";
    
    // Use Supabase edge function to check existence instead of RPC
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-existence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the Authorization header with anon key from the client
        'Authorization': `Bearer ${supabaseSync.auth.anon}`
      },
      body: JSON.stringify({
        type: 'session',
        uniqueKey: uniqueKey
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.id;
  } catch (error) {
    console.error('Error checking if session exists:', error);
    return null;
  }
};

// Check if an interview already exists online by its uniqueKey
export const checkInterviewExists = async (uniqueKey: string): Promise<string | null> => {
  if (!isOnline()) return null;
  
  try {
    // Get the URL and anon key from the imported supabase client instance
    const SUPABASE_URL = "https://jljhtvfrkxehvdvhfktv.supabase.co";
    
    // Use Supabase edge function to check existence instead of RPC
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-existence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the Authorization header with anon key from the client
        'Authorization': `Bearer ${supabaseSync.auth.anon}`
      },
      body: JSON.stringify({
        type: 'interview',
        uniqueKey: uniqueKey
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.id;
  } catch (error) {
    console.error('Error checking if interview exists:', error);
    return null;
  }
};

// Acquire a sync lock
export const acquireSyncLock = async (lockerId: string): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise<boolean>((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = async () => {
        const lock = request.result;
        const now = new Date().getTime();
        
        // If lock exists and is still valid, check if it's our lock
        if (lock && lock.isLocked === 1 && now < lock.expiresAt) {
          // If it's our lock, we can extend it
          if (lock.lockedBy === lockerId) {
            lock.expiresAt = now + 5 * 60 * 1000; // Extend by 5 minutes
            store.put(lock);
            console.log('Extended existing sync lock:', lockerId);
            resolve(true);
            return;
          }
          
          // Someone else has the lock and it's still valid
          console.log('Sync already in progress by:', lock.lockedBy);
          resolve(false);
          return;
        }
        
        // Lock doesn't exist or has expired, create a new one
        const newLock = {
          id: 'main',
          isLocked: 1,
          lockedBy: lockerId,
          lockedAt: now,
          expiresAt: now + 5 * 60 * 1000, // 5 minute expiration
        };
        
        const putRequest = store.put(newLock);
        
        putRequest.onsuccess = () => {
          console.log('Acquired sync lock:', lockerId);
          resolve(true);
        };
        
        putRequest.onerror = (error) => {
          console.error('Error acquiring sync lock:', error);
          resolve(false);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error checking existing sync lock:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error acquiring sync lock:', error);
    return false;
  }
};

// Release a sync lock
export const releaseSyncLock = async (lockerId: string): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise<boolean>((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = async () => {
        const lock = request.result;
        
        // If no lock exists or it's not our lock, don't do anything
        if (!lock) {
          console.log('No lock found to release');
          resolve(false);
          return;
        }
        
        // Remove the lock
        const deleteRequest = store.delete('main');
        
        deleteRequest.onsuccess = () => {
          console.log('Released sync lock:', lockerId);
          resolve(true);
        };
        
        deleteRequest.onerror = (error) => {
          console.error('Error releasing sync lock:', error);
          resolve(false);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error checking existing sync lock for release:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error releasing sync lock:', error);
    return false;
  }
};

// Force release a sync lock (admin function)
export const forceReleaseSyncLock = async (): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise<boolean>((resolve, reject) => {
      // Simply delete the main lock regardless of who owns it
      const deleteRequest = store.delete('main');
      
      deleteRequest.onsuccess = () => {
        console.log('Forcibly released sync lock');
        
        // Log this action
        logSync('SyncLock', 'ForceRelease', 'warning', 
          'Sync lock was forcibly released, which may indicate a stale lock or issue with previous sync');
          
        resolve(true);
      };
      
      deleteRequest.onerror = (error) => {
        console.error('Error force releasing sync lock:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error force releasing sync lock:', error);
    return false;
  }
};

// Log a sync operation
export const logSync = async (
  category: string,
  operation: string,
  status: SyncLogStatus,
  details?: string
): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readwrite');
    const store = transaction.objectStore(STORES.syncLogs);
    
    const logEntry: SyncLog = {
      timestamp: new Date().toISOString(),
      category,
      operation,
      status,
      details: details || '',
      metadata: {
        deviceId: localStorage.getItem('device_id') || 'unknown',
        isOnline: isOnline(),
        userAgent: navigator.userAgent
      }
    };
    
    return new Promise<number>((resolve, reject) => {
      const request = store.add(logEntry);
      
      request.onsuccess = () => {
        const logId = request.result as number;
        resolve(logId);
      };
      
      request.onerror = (error) => {
        console.error('Error logging sync operation:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error logging sync operation:', error);
    return -1;
  }
};

// Get recent sync logs
export const getSyncLogs = async (limit: number = 50): Promise<SyncLog[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readonly');
    const store = transaction.objectStore(STORES.syncLogs);
    const index = store.index('timestamp');
    
    return new Promise<SyncLog[]>((resolve, reject) => {
      // Use a cursor to get the most recent logs
      const logs: SyncLog[] = [];
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && logs.length < limit) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logs);
        }
      };
      
      request.onerror = (error) => {
        console.error('Error getting sync logs:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error getting sync logs:', error);
    return [];
  }
};

// Get sync status
export const getSyncStatus = async (): Promise<SyncStatusData> => {
  try {
    const db = await openDB();
    
    // Get current lock
    let currentLock = null;
    try {
      const lockTransaction = db.transaction([STORES.syncLocks], 'readonly');
      const lockStore = lockTransaction.objectStore(STORES.syncLocks);
      
      const lockRequest = await new Promise<any>((resolve, reject) => {
        const request = lockStore.get('main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = (error) => {
          console.error('Error getting sync lock status:', error);
          resolve(null);
        };
      });
      
      if (lockRequest && lockRequest.isLocked === 1) {
        const now = new Date().getTime();
        
        // If the lock has expired, don't report it
        if (now < lockRequest.expiresAt) {
          currentLock = lockRequest;
        }
      }
    } catch (error) {
      console.error('Error checking sync lock status:', error);
    }
    
    // Get last sync time
    let lastSync = null;
    try {
      const logsTransaction = db.transaction([STORES.syncLogs], 'readonly');
      const logsStore = logsTransaction.objectStore(STORES.syncLogs);
      const logsIndex = logsStore.index('timestamp');
      
      const lastLogRequest = await new Promise<SyncLog | null>((resolve, reject) => {
        // Get the most recent log entry
        const request = logsIndex.openCursor(null, 'prev');
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            resolve(cursor.value as SyncLog);
          } else {
            resolve(null);
          }
        };
        request.onerror = (error) => {
          console.error('Error getting last sync log:', error);
          resolve(null);
        };
      });
      
      if (lastLogRequest) {
        lastSync = lastLogRequest.timestamp;
      }
    } catch (error) {
      console.error('Error checking last sync time:', error);
    }
    
    // Count total and unsynced sessions
    let sessionsTotal = 0;
    let sessionsUnsynced = 0;
    let sessionsInProgress = 0;
    
    try {
      const sessionsTransaction = db.transaction([STORES.sessions], 'readonly');
      const sessionsStore = sessionsTransaction.objectStore(STORES.sessions);
      
      // Count all sessions
      const totalRequest = await new Promise<number>((resolve, reject) => {
        const request = sessionsStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      sessionsTotal = totalRequest;
      
      // Count unsynced sessions
      const unsyncedIndex = sessionsStore.index('synced');
      const unsyncedRequest = await new Promise<number>((resolve, reject) => {
        const request = unsyncedIndex.count(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      sessionsUnsynced = unsyncedRequest;
      
      // Count in-progress sessions (active but not synced)
      const inProgressRequests = await new Promise<OfflineSession[]>((resolve, reject) => {
        const request = sessionsStore.getAll();
        request.onsuccess = () => {
          const sessions = request.result || [];
          const inProgress = sessions.filter(s => s.isActive && !s.synced);
          resolve(inProgress);
        };
        request.onerror = () => resolve([]);
      });
      
      sessionsInProgress = inProgressRequests.length;
    } catch (error) {
      console.error('Error counting sessions:', error);
    }
    
    // Count total and unsynced interviews
    let interviewsTotal = 0;
    let interviewsUnsynced = 0;
    let interviewsInProgress = 0;
    
    try {
      const interviewsTransaction = db.transaction([STORES.interviews], 'readonly');
      const interviewsStore = interviewsTransaction.objectStore(STORES.interviews);
      
      // Count all interviews
      const totalRequest = await new Promise<number>((resolve, reject) => {
        const request = interviewsStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      interviewsTotal = totalRequest;
      
      // Count unsynced interviews
      const unsyncedIndex = interviewsStore.index('synced');
      const unsyncedRequest = await new Promise<number>((resolve, reject) => {
        const request = unsyncedIndex.count(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      interviewsUnsynced = unsyncedRequest;
      
      // Count in-progress interviews (no end time and not synced)
      const inProgressRequests = await new Promise<OfflineInterview[]>((resolve, reject) => {
        const request = interviewsStore.getAll();
        request.onsuccess = () => {
          const interviews = request.result || [];
          const inProgress = interviews.filter(i => !i.endTime && !i.synced);
          resolve(inProgress);
        };
        request.onerror = () => resolve([]);
      });
      
      interviewsInProgress = inProgressRequests.length;
    } catch (error) {
      console.error('Error counting interviews:', error);
    }
    
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
    console.error('Fatal error getting sync status:', error);
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
};

// Sync offline sessions
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isOnline()) {
    console.log('Cannot sync while offline');
    return false;
  }
  
  try {
    // Get unsynced sessions
    const sessions = await getUnsyncedSessions();
    const interviews = await getUnsyncedInterviews();
    
    if (sessions.length === 0 && interviews.length === 0) {
      console.log('Nothing to sync');
      await logSync('Sync', 'Check', 'success', 'No unsynced data to sync');
      return true;
    }
    
    console.log(`Syncing ${sessions.length} sessions and ${interviews.length} interviews`);
    await logSync('Sync', 'Start', 'success', `Starting sync of ${sessions.length} sessions and ${interviews.length} interviews`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Sync each session
    for (const session of sessions) {
      try {
        // Check if session already exists online
        const existingId = await checkSessionExists(session.uniqueKey);
        
        if (existingId) {
          console.log(`Session ${session.id} already exists online as ${existingId}`);
          await markSessionAsSynced(session.id as number, existingId);
          successCount++;
          continue;
        }
        
        // Prepare data for supabase
        const sessionData = {
          interviewer_id: session.interviewerCode,  // This might need adjustment based on actual data structure
          project_id: session.projectId,
          start_time: session.startTime,
          end_time: session.endTime || null,
          start_latitude: session.startLatitude,
          start_longitude: session.startLongitude,
          start_address: session.startAddress,
          end_latitude: session.endLatitude,
          end_longitude: session.endLongitude,
          end_address: session.endAddress,
          is_active: session.isActive,
          unique_key: session.uniqueKey
        };
        
        // Insert into Supabase
        const response = await supabaseSync
          .from('sessions')
          .insert([sessionData])
          .select()
          .single();
          
        if (response.error) {
          throw response.error;
        }
        
        const data = response.data;
        
        console.log(`Synced session ${session.id} to online id ${data.id}`);
        await markSessionAsSynced(session.id as number, data.id);
        successCount++;
      } catch (error) {
        console.error(`Error syncing session ${session.id}:`, error);
        errorCount++;
        await logSync('SessionSync', 'Error', 'error', `Failed to sync session ${session.id}: ${error}`);
      }
    }
    
    // Sync each interview
    for (const interview of interviews) {
      try {
        // Check if interview already exists online
        const existingId = await checkInterviewExists(interview.uniqueKey);
        
        if (existingId) {
          console.log(`Interview ${interview.id} already exists online as ${existingId}`);
          await markInterviewAsSynced(interview.id as number, existingId);
          successCount++;
          continue;
        }
        
        // Get the session this interview belongs to
        let onlineSessionId = null;
        
        // Find the online session ID for this interview
        if (interview.sessionId) {
          const db = await openDB();
          const sessionTransaction = db.transaction([STORES.sessions], 'readonly');
          const sessionStore = sessionTransaction.objectStore(STORES.sessions);
          
          const offlineSession = await new Promise<OfflineSession | undefined>((resolve) => {
            const request = sessionStore.get(interview.sessionId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(undefined);
          });
          
          if (offlineSession && offlineSession.onlineId) {
            onlineSessionId = offlineSession.onlineId;
          } else {
            console.log(`Cannot find online session ID for interview ${interview.id}, sessionId ${interview.sessionId}`);
            // Skip this interview for now
            continue;
          }
        }
        
        // Prepare interview data for supabase
        const interviewData = {
          session_id: onlineSessionId,
          candidate_name: interview.candidateName,
          project_id: interview.projectId,
          start_time: interview.startTime,
          end_time: interview.endTime || null,
          start_latitude: interview.startLatitude,
          start_longitude: interview.startLongitude,
          start_address: interview.startAddress,
          end_latitude: interview.endLatitude,
          end_longitude: interview.endLongitude,
          end_address: interview.endAddress,
          result: interview.result,
          is_active: !interview.endTime,
          unique_key: interview.uniqueKey
        };
        
        // Insert into Supabase
        const response = await supabaseSync
          .from('interviews')
          .insert([interviewData])
          .select()
          .single();
          
        if (response.error) {
          throw response.error;
        }
        
        const data = response.data;
        
        console.log(`Synced interview ${interview.id} to online id ${data.id}`);
        await markInterviewAsSynced(interview.id as number, data.id);
        successCount++;
      } catch (error) {
        console.error(`Error syncing interview ${interview.id}:`, error);
        errorCount++;
        await logSync('InterviewSync', 'Error', 'error', `Failed to sync interview ${interview.id}: ${error}`);
      }
    }
    
    // Log sync completion
    await logSync('Sync', 'Complete', 'success', 
      `Completed sync: ${successCount} successful, ${errorCount} failed`);
      
    return errorCount === 0;
  } catch (error) {
    console.error('Error during sync:', error);
    await logSync('Sync', 'Error', 'error', `Sync failed with error: ${error}`);
    return false;
  }
};
