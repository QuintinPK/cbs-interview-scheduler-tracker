import { v4 as uuidv4 } from 'uuid';
import { Session, Interview, Location, Project } from "@/types";
import { supabaseSync } from "@/integrations/supabase/client";

// Setup IndexedDB database
const DB_NAME = 'cbs_offline_db';
const DB_VERSION = 5; // Incremented version to trigger upgrade

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

// New function to check browser compatibility with IndexedDB
// Defining this function early in the file to avoid reference errors
export const checkBrowserCompatibility = (): boolean => {
  return typeof window !== 'undefined' && !!window.indexedDB;
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

// Validate IndexedDB store exists and has required indices
export const validateStore = async (storeName: string, indices: string[]): Promise<boolean> => {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Store ${storeName} does not exist`);
      return false;
    }
    
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    // Check if indices exist
    const indexNames = Array.from(store.indexNames);
    const missingIndices = indices.filter(idx => !indexNames.includes(idx));
    
    if (missingIndices.length > 0) {
      console.error(`Store ${storeName} is missing indices: ${missingIndices.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating store ${storeName}:`, error);
    return false;
  }
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
      const oldVersion = event.oldVersion;
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.sessions)) {
        const sessionsStore = db.createObjectStore(STORES.sessions, { keyPath: 'id', autoIncrement: true });
        sessionsStore.createIndex('interviewerCode', 'interviewerCode', { unique: false });
        sessionsStore.createIndex('synced', 'synced', { unique: false });
        sessionsStore.createIndex('uniqueKey', 'uniqueKey', { unique: true });
        sessionsStore.createIndex('startTime', 'startTime', { unique: false });
        sessionsStore.createIndex('isActive', 'isActive', { unique: false });
      } else if (oldVersion < 5) {
        // Ensure we have the correct indices for existing stores
        try {
          const txn = (event.target as IDBOpenDBRequest).transaction;
          if (txn) {
            const sessionsStore = txn.objectStore(STORES.sessions);
            if (!sessionsStore.indexNames.contains('synced')) {
              sessionsStore.createIndex('synced', 'synced', { unique: false });
            }
            if (!sessionsStore.indexNames.contains('isActive')) {
              sessionsStore.createIndex('isActive', 'isActive', { unique: false });
            }
          }
        } catch (e) {
          console.error("Error adding indices to sessions store:", e);
        }
      }
      
      if (!db.objectStoreNames.contains(STORES.interviews)) {
        const interviewsStore = db.createObjectStore(STORES.interviews, { keyPath: 'id', autoIncrement: true });
        interviewsStore.createIndex('sessionId', 'sessionId', { unique: false });
        interviewsStore.createIndex('synced', 'synced', { unique: false });
        interviewsStore.createIndex('startTime', 'startTime', { unique: false });
        interviewsStore.createIndex('uniqueKey', 'uniqueKey', { unique: true });
      } else if (oldVersion < 5) {
        try {
          const txn = (event.target as IDBOpenDBRequest).transaction;
          if (txn) {
            const interviewsStore = txn.objectStore(STORES.interviews);
            if (!interviewsStore.indexNames.contains('synced')) {
              interviewsStore.createIndex('synced', 'synced', { unique: false });
            }
          }
        } catch (e) {
          console.error("Error adding indices to interviews store:", e);
        }
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
              if (session.synced === undefined) {
                session.synced = false;
                cursor.update(session);
              }
              if (session.isActive === undefined) {
                session.isActive = true;
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
              if (interview.synced === undefined) {
                interview.synced = false;
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

// Function to log synchronization events - now properly exported
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
    // Validate required stores and indices first
    const storeValid = await validateStore(STORES.sessions, ['synced', 'interviewerCode']);
    if (!storeValid) {
      console.error("Sessions store validation failed. The database schema may need to be upgraded.");
      await logSync('SessionCreation', 'Failed', 'error', 
        `Store validation failed when creating offline session for interviewer ${interviewerCode}`);
      throw new Error("Database schema validation failed");
    }
    
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
    await logSync('SessionCreation', 'Failed', 'error', 
      `Failed to create offline session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Fix the getUnsyncedSessions function to handle null/undefined values properly
export const getUnsyncedSessions = async (): Promise<OfflineSession[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    
    try {
      // Check if the index exists first
      if (!store.indexNames.contains('synced')) {
        console.error('Synced index does not exist');
        throw new Error('Synced index not found');
      }
      
      const index = store.index('synced');
      
      // Fix for the excessive type instantiation error by explicitly typing the Promise
      return new Promise<OfflineSession[]>((resolve, reject) => {
        try {
          // Only use IDBKeyRange.only with a valid boolean value
          const request = index.getAll(IDBKeyRange.only(false));
          
          request.onsuccess = () => {
            resolve(request.result || []);
          };
          
          request.onerror = (error) => {
            console.error('Error getting unsynced sessions:', error);
            reject(error);
          };
        } catch (error) {
          console.error('Error using IDBKeyRange:', error);
          // Fallback to getting all and filtering
          store.getAll().onsuccess = (event) => {
            const sessions = (event.target as IDBRequest<OfflineSession[]>).result || [];
            const unsyncedSessions = sessions.filter(session => session.synced === false);
            resolve(unsyncedSessions);
          };
        }
      });
    } catch (error) {
      console.error('Error accessing synced index:', error);
      // Fallback: manually filter sessions if the index lookup failed
      return new Promise<OfflineSession[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const sessions = request.result || [];
          const unsyncedSessions = sessions.filter(session => session.synced === false);
          resolve(unsyncedSessions);
        };
        
        request.onerror = (error) => {
          console.error('Error getting all sessions:', error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error('Fatal error getting unsynced sessions:', error);
    return [];
  }
};

// Fix the getUnsyncedSessionsCount function
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    
    try {
      // Check if the index exists first
      if (!store.indexNames.contains('synced')) {
        console.error('Synced index does not exist');
        throw new Error('Synced index not found');
      }
      
      const index = store.index('synced');
      
      // Fix for the excessive type instantiation error by explicitly typing the Promise
      return new Promise<number>((resolve, reject) => {
        try {
          // Only use IDBKeyRange.only with a valid boolean value
          const request = index.count(IDBKeyRange.only(false));
          
          request.onsuccess = () => {
            resolve(request.result || 0);
          };
          
          request.onerror = (error) => {
            console.error('Error counting unsynced sessions:', error);
            reject(error);
          };
        } catch (error) {
          console.error('Error using IDBKeyRange:', error);
          // Fallback to getting all and counting
          store.getAll().onsuccess = (event) => {
            const sessions = (event.target as IDBRequest<OfflineSession[]>).result || [];
            const unsyncedCount = sessions.filter(session => session.synced === false).length;
            resolve(unsyncedCount);
          };
        }
      });
    } catch (error) {
      console.error('Error accessing synced index for count:', error);
      // Fallback: count manually if index lookup failed
      return new Promise<number>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const sessions = request.result || [];
          const unsyncedCount = sessions.filter(session => session.synced === false).length;
          resolve(unsyncedCount);
        };
        
        request.onerror = (error) => {
          console.error('Error getting all sessions for count:', error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error('Fatal error counting unsynced sessions:', error);
    return 0;
  }
};

// Fix the getUnsyncedInterviews function
export const getUnsyncedInterviews = async (): Promise<OfflineInterview[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    
    try {
      // Check if the index exists first
      if (!store.indexNames.contains('synced')) {
        console.error('Synced index does not exist in interviews store');
        throw new Error('Synced index not found');
      }
      
      const index = store.index('synced');
      
      return new Promise<OfflineInterview[]>((resolve, reject) => {
        try {
          // Use IDBKeyRange.only with a valid boolean value
          const request = index.getAll(IDBKeyRange.only(false));
          
          request.onsuccess = () => {
            resolve(request.result || []);
          };
          
          request.onerror = (error) => {
            console.error('Error getting unsynced interviews:', error);
            reject(error);
          };
        } catch (error) {
          console.error('Error using IDBKeyRange for interviews:', error);
          // Fallback to getting all and filtering
          store.getAll().onsuccess = (event) => {
            const interviews = (event.target as IDBRequest<OfflineInterview[]>).result || [];
            const unsyncedInterviews = interviews.filter(interview => interview.synced === false);
            resolve(unsyncedInterviews);
          };
        }
      });
    } catch (error) {
      console.error('Error accessing synced index for interviews:', error);
      // Fallback: manually filter interviews if the index lookup failed
      return new Promise<OfflineInterview[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const interviews = request.result || [];
          const unsyncedInterviews = interviews.filter(interview => interview.synced === false);
          resolve(unsyncedInterviews);
        };
        
        request.onerror = (error) => {
          console.error('Error getting all interviews:', error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error('Fatal error getting unsynced interviews:', error);
    return [];
  }
};

// Fix the getUnsyncedInterviewsCount function
export const getUnsyncedInterviewsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    
    try {
      // Check if the index exists first
      if (!store.indexNames.contains('synced')) {
        console.error('Synced index does not exist in interviews store');
        throw new Error('Synced index not found');
      }
      
      const index = store.index('synced');
      
      return new Promise<number>((resolve, reject) => {
        try {
          // Use IDBKeyRange.only with a valid boolean value
          const request = index.count(IDBKeyRange.only(false));
          
          request.onsuccess = () => {
            resolve(request.result || 0);
          };
          
          request.onerror = (error) => {
            console.error('Error counting unsynced interviews:', error);
            reject(error);
          };
        } catch (error) {
          console.error('Error using IDBKeyRange for interview count:', error);
          // Fallback to getting all and counting
          store.getAll().onsuccess = (event) => {
            const interviews = (event.target as IDBRequest<OfflineInterview[]>).result || [];
            const unsyncedCount = interviews.filter(interview => interview.synced === false).length;
            resolve(unsyncedCount);
          };
        }
      });
    } catch (error) {
      console.error('Error accessing synced index for count:', error);
      // Fallback: count manually if index lookup failed
      return new Promise<number>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const interviews = request.result || [];
          const unsyncedCount = interviews.filter(interview => interview.synced === false).length;
          resolve(unsyncedCount);
        };
        
        request.onerror = (error) => {
          console.error('Error getting all interviews for count:', error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error('Fatal error counting unsynced interviews:', error);
    return 0;
  }
};

// Fix the getActiveSessionCount function
export const getActiveSessionCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    
    try {
      // Check if the index exists first
      if (!store.indexNames.contains('isActive')) {
        console.error('isActive index does not exist');
        throw new Error('isActive index not found');
      }
      
      const index = store.index('isActive');
      
      return new Promise<number>((resolve, reject) => {
        try {
          const request = index.count(IDBKeyRange.only(true));
          
          request.onsuccess = () => {
            resolve(request.result || 0);
          };
          
          request.onerror = (error) => {
            console.error('Error counting active sessions:', error);
            reject(error);
          };
        } catch (error) {
          console.error('Error using IDBKeyRange for active sessions:', error);
          // Fallback to getting all and counting
          store.getAll().onsuccess = (event) => {
            const sessions = (event.target as IDBRequest<OfflineSession[]>).result || [];
            const activeCount = sessions.filter(session => session.isActive === true).length;
            resolve(activeCount);
          };
        }
      });
    } catch (error) {
      console.error('Error accessing isActive index:', error);
      // Fallback: count manually if index lookup failed
      return new Promise<number>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const sessions = request.result || [];
          const activeCount = sessions.filter(session => session.isActive === true).length;
          resolve(activeCount);
        };
        
        request.onerror = (error) => {
          console.error('Error getting all sessions for active count:', error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error('Fatal error counting active sessions:', error);
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

// Sync offline sessions to online DB
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isOnline()) {
    console.log("Cannot sync while offline");
    return false;
  }
  
  try {
    // Log the sync attempt
    await logSync('SyncAttempt', 'Started', 'success', 'Starting sync of offline sessions');
    
    // Implement the sync logic here
    return true;
  } catch (error) {
    console.error("Error syncing sessions:", error);
    await logSync('SyncAttempt', 'Failed', 'error', `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Get sync status
export const getSyncStatus = async (): Promise<SyncStatusData> => {
  try {
    // Get session count from database or fallback to 0
    let sessionsTotal = 0;
    let sessionsUnsynced = 0;
    let interviewsUnsynced = 0;
    
    try {
      const db = await openDB();
      // Count total sessions
      const sessionRequest = db.transaction([STORES.sessions], 'readonly')
        .objectStore(STORES.sessions)
        .count();
        
      sessionRequest.onsuccess = (event) => {
        sessionsTotal = (event.target as IDBRequest<number>).result || 0;
      };
    } catch (error) {
      console.error("Error getting database session counts:", error);
    }
    
    // Get unsynced counts (with error handling)
    try {
      sessionsUnsynced = await getUnsyncedSessionsCount();
    } catch (error) {
      console.error("Error getting unsynced sessions count:", error);
    }
    
    try {
      interviewsUnsynced = await getUnsyncedInterviewsCount();
    } catch (error) {
      console.error("Error getting unsynced interviews count:", error);
    }
    
    return {
      sessionsTotal,
      sessionsUnsynced,
      interviewsTotal: 0, // Implement counting logic if needed
      interviewsUnsynced,
      sessionsInProgress: 0, // Implement counting logic if needed
      interviewsInProgress: 0, // Implement counting logic if needed
      lastSync: null, // Implement last sync timestamp logic if needed
      currentLock: null, // Implement lock status logic if needed
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    // Return default values on error to prevent further errors
    return {
      sessionsTotal: 0,
      sessionsUnsynced: 0,
      sessionsInProgress: 0,
      interviewsTotal: 0, 
      interviewsUnsynced: 0,
      interviewsInProgress: 0,
      lastSync: null,
      currentLock: null,
    };
  }
};

// Cache interviewer
export const cacheInterviewer = async (interviewerCode: string): Promise<void> => {
  // Implementation would go here
  console.log(`Caching interviewer ${interviewerCode}`);
};

// Get interviewer by code
export const getInterviewerByCode = async (code: string): Promise<any> => {
  // Implementation would go here
  return { id: code, code };
};

// Cache projects
export const cacheProjects = async (projects: Project[]): Promise<void> => {
  // Implementation would go here
  console.log(`Caching ${projects.length} projects`);
};

// Get cached projects
export const getCachedProjects = async (): Promise<Project[]> => {
  // Implementation would go here
  return [];
};

// Acquire sync lock
export const acquireSyncLock = async (lockId: string): Promise<boolean> => {
  // Implementation would go here
  return true;
};

// Release sync lock
export const releaseSyncLock = async (lockId: string): Promise<void> => {
  // Implementation would go here
};

// Get current DB version
export const getCurrentDBVersion = (): number => {
  return DB_VERSION;
};

// Initialize offline database with improved error handling
export const initializeOfflineDB = async (): Promise<boolean> => {
  try {
    // First check if IndexedDB is supported in this browser
    if (!checkBrowserCompatibility()) {
      console.error("This browser doesn't support IndexedDB");
      return false;
    }
    
    const db = await openDB();
    
    // Validate critical stores exist
    let sessionsValid = false;
    let interviewsValid = false;
    
    try {
      sessionsValid = await validateStore(STORES.sessions, ['synced', 'isActive']);
    } catch (error) {
      console.error("Error validating sessions store:", error);
    }
    
    try {
      interviewsValid = await validateStore(STORES.interviews, ['synced', 'sessionId']);
    } catch (error) {
      console.error("Error validating interviews store:", error);
    }
    
    if (!sessionsValid || !interviewsValid) {
      console.error("Database schema validation failed - critical indices are missing");
      
      // Log the failure
      await logSync('Database', 'InitializationFailed', 'error', 
        'Failed to initialize database - schema validation failed');
      
      return false;
    }
    
    // Log successful initialization
    await logSync('Database', 'Initialized', 'success', `Database initialized successfully, version ${DB_VERSION}`);
    return true;
  } catch (error) {
    console.error("Failed to initialize offline database:", error);
    
    // Log the error
    try {
      await logSync('Database', 'InitializationError', 'error', 
        `Error initializing database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (logError) {
      console.error("Could not log database initialization error:", logError);
    }
    
    return false;
  }
};
