
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

// Define SyncLock interface to ensure proper typing
interface SyncLock {
  id: string;
  isLocked: number;
  lockedBy: string;
  lockedAt: number;
  expiresAt: number;
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
  currentLock: SyncLock | null;
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

// Function to log synchronization events - now exported
export const logSync = async (
  category: string,
  operation: string,
  status: SyncLogStatus, 
  details: string
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readwrite');
    const store = transaction.objectStore(STORES.syncLogs);
    
    const log: SyncLog = {
      timestamp: new Date().toISOString(),
      category,
      operation,
      status,
      details,
      metadata: {
        deviceId: localStorage.getItem('device_id') || 'unknown',
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (error) => {
        console.error('Error logging sync event:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error logging sync event:', error);
    return Promise.resolve(); // Don't fail the calling function if logging fails
  }
};

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
          const { data: interviewers, error } = await supabaseSync
            .from('interviewers')
            .select('*')
            .eq('code', interviewerCode)
            .limit(1);
            
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
          const { data: interviewers, error } = await supabaseSync
            .from('interviewers')
            .select('*')
            .eq('code', interviewerCode)
            .limit(1);
            
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
    // Get the URL from environment variable
    const SUPABASE_URL = "https://jljhtvfrkxehvdvhfktv.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsamh0dmZya3hlaHZkdmhma3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzc0MzgsImV4cCI6MjA1OTY1MzQzOH0.No4bnq7PUvkeNMZliZx8QV-KEEemjcwaw_HfBT0bqrM";
    
    // Use Supabase edge function to check existence
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-existence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        type: 'session',
        uniqueKey: uniqueKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
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
    // Get the URL from environment variable
    const SUPABASE_URL = "https://jljhtvfrkxehvdvhfktv.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsamh0dmZya3hlaHZkdmhma3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNzc0MzgsImV4cCI6MjA1OTY1MzQzOH0.No4bnq7PUvkeNMZliZx8QV-KEEemjcwaw_HfBT0bqrM";
    
    // Use Supabase edge function to check existence
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-existence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        type: 'interview',
        uniqueKey: uniqueKey
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
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

// Get the sync status
export const getSyncStatus = async (): Promise<SyncStatusData> => {
  try {
    const sessionsTotal = await getTotalSessionsCount();
    const sessionsUnsynced = await getUnsyncedSessionsCount();
    const interviewsTotal = await getTotalInterviewsCount();
    const interviewsUnsynced = await getUnsyncedInterviewsCount();
    
    // Get in-progress counts
    const inProgressCounts = await getInProgressCounts();
    
    // Get last sync time
    const lastSync = await getLastSyncTime();
    
    // Get current lock status
    const currentLock = await getSyncLock();
    
    return {
      sessionsTotal,
      sessionsUnsynced,
      sessionsInProgress: inProgressCounts.sessions,
      interviewsTotal,
      interviewsUnsynced,
      interviewsInProgress: inProgressCounts.interviews,
      lastSync,
      currentLock
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    // Return default values if error
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

// Helper function for getSyncStatus
const getTotalSessionsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    
    return new Promise<number>((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result || 0);
      };
      
      request.onerror = (error) => {
        console.error('Error counting sessions:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error counting sessions:', error);
    return 0;
  }
};

// Helper function for getSyncStatus
const getTotalInterviewsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    
    return new Promise<number>((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result || 0);
      };
      
      request.onerror = (error) => {
        console.error('Error counting interviews:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error counting interviews:', error);
    return 0;
  }
};

// Helper function to get in-progress counts
const getInProgressCounts = async (): Promise<{ sessions: number, interviews: number }> => {
  // For now just return 0 since we don't track in-progress separately
  return { sessions: 0, interviews: 0 };
};

// Helper function to get last sync time
const getLastSyncTime = async (): Promise<string | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readonly');
    const store = transaction.objectStore(STORES.syncLogs);
    const index = store.index('timestamp');
    
    return new Promise<string | null>((resolve, reject) => {
      // Get the latest log entry
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value.timestamp);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (error) => {
        console.error('Error getting last sync time:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error getting last sync time:', error);
    return null;
  }
};

// Acquire a sync lock
export const acquireSyncLock = async (lockId: string): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    // Check if there's an existing lock
    return new Promise<boolean>((resolve, reject) => {
      const getRequest = store.get('main');
      
      getRequest.onsuccess = () => {
        const existingLock = getRequest.result as SyncLock | undefined;
        const now = Date.now();
        
        // If lock exists and hasn't expired
        if (existingLock?.isLocked === 1 && existingLock.expiresAt > now) {
          // Lock is active, can't acquire
          resolve(false);
        } else {
          // Create a new lock or update expired one
          const newLock: SyncLock = {
            id: 'main',
            isLocked: 1,
            lockedBy: lockId,
            lockedAt: now,
            expiresAt: now + (5 * 60 * 1000) // 5 minutes expiration
          };
          
          const putRequest = store.put(newLock);
          
          putRequest.onsuccess = () => {
            // Successfully acquired lock
            resolve(true);
          };
          
          putRequest.onerror = (error) => {
            console.error('Error acquiring sync lock:', error);
            reject(error);
          };
        }
      };
      
      getRequest.onerror = (error) => {
        console.error('Error checking sync lock:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error acquiring sync lock:', error);
    return false;
  }
};

// Release a sync lock
export const releaseSyncLock = async (lockId: string): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise<boolean>((resolve, reject) => {
      // Check if we own the lock first
      const getRequest = store.get('main');
      
      getRequest.onsuccess = () => {
        const existingLock = getRequest.result as SyncLock | undefined;
        
        // Special case for forced release
        const isForced = lockId.startsWith('force-release');
        
        if (!existingLock || (existingLock.lockedBy !== lockId && !isForced)) {
          // We don't own this lock or it doesn't exist
          resolve(false);
        } else {
          // Release the lock
          const releasedLock: SyncLock = {
            id: 'main',
            isLocked: 0,
            lockedBy: '',
            lockedAt: 0,
            expiresAt: 0
          };
          
          const putRequest = store.put(releasedLock);
          
          putRequest.onsuccess = () => {
            // Successfully released lock
            resolve(true);
          };
          
          putRequest.onerror = (error) => {
            console.error('Error releasing sync lock:', error);
            reject(error);
          };
        }
      };
      
      getRequest.onerror = (error) => {
        console.error('Error checking sync lock for release:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error releasing sync lock:', error);
    return false;
  }
};

// Get current sync lock
const getSyncLock = async (): Promise<SyncLock | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readonly');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise<SyncLock | null>((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = () => {
        const result = request.result as SyncLock | undefined;
        // Return the lock data if available, otherwise null
        resolve(result || null);
      };
      
      request.onerror = (error) => {
        console.error('Error getting sync lock:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error getting sync lock:', error);
    return null;
  }
};

// Function to synchronize offline sessions
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isOnline()) {
    console.log('Cannot sync while offline');
    return false;
  }
  
  try {
    // Sync unsynced sessions first
    const sessions = await getUnsyncedSessions();
    
    if (sessions.length > 0) {
      await logSync('SyncStart', 'Sessions', 'success', 
        `Starting sync for ${sessions.length} sessions`);
      
      for (const session of sessions) {
        try {
          // Check if session already exists online to prevent duplicates
          let onlineSessionId;
          
          if (session.uniqueKey) {
            onlineSessionId = await checkSessionExists(session.uniqueKey);
          }
          
          if (onlineSessionId) {
            // Session already exists, just mark as synced with the online ID
            await markSessionAsSynced(session.id!, onlineSessionId);
            await logSync('SessionSync', 'ExistingFound', 'success', 
              `Session ${session.id} already existed online with ID ${onlineSessionId}`);
          } else {
            // Session doesn't exist online, create it
            const { data, error } = await supabaseSync
              .from('sessions')
              .insert({
                interviewer_id: session.interviewerCode,
                project_id: session.projectId,
                start_time: session.startTime,
                end_time: session.endTime || null,
                start_latitude: session.startLatitude || null,
                start_longitude: session.startLongitude || null,
                start_address: session.startAddress || null,
                end_latitude: session.endLatitude || null,
                end_longitude: session.endLongitude || null,
                end_address: session.endAddress || null,
                is_active: session.isActive
              })
              .select()
              .single();
            
            if (error) {
              throw error;
            }
            
            await markSessionAsSynced(session.id!, data.id);
            await logSync('SessionSync', 'Created', 'success', 
              `Synced session ${session.id} to online ID ${data.id}`);
          }
        } catch (error) {
          console.error(`Error syncing session ${session.id}:`, error);
          await logSync('SessionSync', 'Error', 'error', 
            `Error syncing session ${session.id}: ${error}`);
        }
      }
    }
    
    // Now sync unsynced interviews
    const interviews = await getUnsyncedInterviews();
    
    if (interviews.length > 0) {
      await logSync('SyncStart', 'Interviews', 'success', 
        `Starting sync for ${interviews.length} interviews`);
      
      for (const interview of interviews) {
        try {
          // Find the associated session that should already be synced
          const relatedSession = await getOfflineSession(interview.sessionId);
          
          if (!relatedSession || !relatedSession.onlineId) {
            // Related session not found or not synced yet
            await logSync('InterviewSync', 'SessionNotSynced', 'warning', 
              `Cannot sync interview ${interview.id}, session ${interview.sessionId} not synced`);
            continue;
          }
          
          // Check if interview already exists online to prevent duplicates
          let onlineInterviewId;
          
          if (interview.uniqueKey) {
            onlineInterviewId = await checkInterviewExists(interview.uniqueKey);
          }
          
          if (onlineInterviewId) {
            // Interview already exists, just mark as synced with the online ID
            await markInterviewAsSynced(interview.id!, onlineInterviewId);
            await logSync('InterviewSync', 'ExistingFound', 'success', 
              `Interview ${interview.id} already existed online with ID ${onlineInterviewId}`);
          } else {
            // Interview doesn't exist online, create it
            const { data, error } = await supabaseSync
              .from('interviews')
              .insert({
                session_id: relatedSession.onlineId,
                candidate_name: interview.candidateName,
                project_id: interview.projectId,
                start_time: interview.startTime,
                end_time: interview.endTime || null,
                start_latitude: interview.startLatitude || null,
                start_longitude: interview.startLongitude || null,
                start_address: interview.startAddress || null,
                end_latitude: interview.endLatitude || null,
                end_longitude: interview.endLongitude || null,
                end_address: interview.endAddress || null,
                result: interview.result,
                is_active: false
              })
              .select()
              .single();
            
            if (error) {
              throw error;
            }
            
            await markInterviewAsSynced(interview.id!, data.id);
            await logSync('InterviewSync', 'Created', 'success', 
              `Synced interview ${interview.id} to online ID ${data.id}`);
          }
        } catch (error) {
          console.error(`Error syncing interview ${interview.id}:`, error);
          await logSync('InterviewSync', 'Error', 'error', 
            `Error syncing interview ${interview.id}: ${error}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing offline data:', error);
    await logSync('SyncError', 'Fatal', 'error', 
      `Fatal error during sync: ${error}`);
    return false;
  }
};

// Get a specific offline session
const getOfflineSession = async (sessionId: number): Promise<OfflineSession | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (error) => {
        console.error(`Error getting session ${sessionId}:`, error);
        reject(error);
      };
    });
  } catch (error) {
    console.error(`Fatal error getting session ${sessionId}:`, error);
    return null;
  }
};
