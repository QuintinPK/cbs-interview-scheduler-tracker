
import { v4 as uuidv4 } from 'uuid';
import { Session, Interview, Location, Project } from "@/types";

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
  syncLogs: 'syncLogs'
};

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
      
      // Add migration to ensure existing sessions and interviews have uniqueKey
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
  const hashBase = `${interviewerCode}-${startTime}-${deviceId}-${randomFactor}`;
  return uuidv4({ random: hashBase.split('').map(c => c.charCodeAt(0) % 256) });
};

// Generate a unique key for interviews
export const generateInterviewUniqueKey = (interview: any): string => {
  const sessionId = interview.sessionId || 'unknown';
  const startTime = interview.startTime || new Date().toISOString();
  const deviceId = localStorage.getItem('device_id') || 'unknown';
  const randomFactor = Math.random().toString(36).substring(2, 10);
  
  const hashBase = `${sessionId}-${startTime}-${deviceId}-${randomFactor}`;
  return uuidv4({ random: hashBase.split('').map(c => c.charCodeAt(0) % 256) });
};

// Initialize device ID if not exists
export const initializeDeviceId = (): void => {
  if (!localStorage.getItem('device_id')) {
    localStorage.setItem('device_id', uuidv4());
    console.log('Device ID initialized');
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
export const getUnsyncedSessions = async (): Promise<any[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      // Use the key parameter for boolean indexes
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

// Get the count of unsynced sessions
export const getUnsyncedSessionsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.sessions], 'readonly');
    const store = transaction.objectStore(STORES.sessions);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      // Use the key parameter for boolean indexes
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
export const getUnsyncedInterviews = async (): Promise<any[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      // Use the key parameter for boolean indexes
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

// Get the count of unsynced interviews
export const getUnsyncedInterviewsCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.interviews], 'readonly');
    const store = transaction.objectStore(STORES.interviews);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      // Use the key parameter for boolean indexes
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
export const getInterviewsForOfflineSession = async (sessionId: number): Promise<any[]> => {
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
export const getOfflineInterview = async (interviewId: number): Promise<any | null> => {
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
        const session = request.result;
        
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
        const interview = request.result;
        
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
          const { supabase } = await import('@/integrations/supabase/client');
          
          const { data: interviewers, error } = await supabase
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
          const { supabase } = await import('@/integrations/supabase/client');
          
          const { data: interviewers, error } = await supabase
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
    const { supabase } = await import('@/integrations/supabase/client');
    
    // First try to find by uniqueKey
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('unique_key', uniqueKey)
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    if (sessions && sessions.length > 0) {
      return sessions[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking if session exists:', error);
    return null;
  }
};

// Check if an interview already exists online by its uniqueKey
export const checkInterviewExists = async (uniqueKey: string): Promise<string | null> => {
  if (!isOnline()) return null;
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Try to find by uniqueKey
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('id')
      .eq('unique_key', uniqueKey)
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    if (interviews && interviews.length > 0) {
      return interviews[0].id;
    }
    
    return null;
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
    
    return new Promise((resolve, reject) => {
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
        console.error('Error checking sync lock:', error);
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
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = async () => {
        const lock = request.result;
        
        // Only release if it's our lock
        if (lock && lock.lockedBy === lockerId) {
          lock.isLocked = 0;
          lock.releasedAt = new Date().getTime();
          
          const updateRequest = store.put(lock);
          
          updateRequest.onsuccess = () => {
            console.log('Released sync lock:', lockerId);
            resolve(true);
          };
          
          updateRequest.onerror = (error) => {
            console.error('Error releasing sync lock:', error);
            resolve(false);
          };
        } else {
          // Not our lock or no lock exists
          console.log('Cannot release lock - not owned by:', lockerId);
          resolve(false);
        }
      };
      
      request.onerror = (error) => {
        console.error('Error checking sync lock for release:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error releasing sync lock:', error);
    return false;
  }
};

// Force release any sync lock (for recovery)
export const forceReleaseSyncLock = async (): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLocks], 'readwrite');
    const store = transaction.objectStore(STORES.syncLocks);
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      
      request.onsuccess = async () => {
        const lock = request.result;
        
        if (!lock) {
          resolve(true);
          return;
        }
        
        lock.isLocked = 0;
        lock.releasedAt = new Date().getTime();
        lock.forcedRelease = true;
        
        const updateRequest = store.put(lock);
        
        updateRequest.onsuccess = () => {
          console.log('Force released sync lock');
          
          // Log the forced release
          logSync('SyncLock', 'ForceReleased', 'warning', 
            `Forced release of sync lock held by ${lock.lockedBy}`);
          
          resolve(true);
        };
        
        updateRequest.onerror = (error) => {
          console.error('Error force releasing sync lock:', error);
          resolve(false);
        };
      };
      
      request.onerror = (error) => {
        console.error('Error checking sync lock for force release:', error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Fatal error force releasing sync lock:', error);
    return false;
  }
};

// Get sync status
export const getSyncStatus = async (): Promise<any> => {
  try {
    const db = await openDB();
    
    // Get sessions info
    const sessionsTransaction = db.transaction([STORES.sessions], 'readonly');
    const sessionsStore = sessionsTransaction.objectStore(STORES.sessions);
    const sessionsSyncIndex = sessionsStore.index('synced');
    
    // Get interviews info
    const interviewsTransaction = db.transaction([STORES.interviews], 'readonly');
    const interviewsStore = interviewsTransaction.objectStore(STORES.interviews);
    const interviewsSyncIndex = interviewsStore.index('synced');
    
    // Get sync lock info
    const syncLocksTransaction = db.transaction([STORES.syncLocks], 'readonly');
    const syncLocksStore = syncLocksTransaction.objectStore(STORES.syncLocks);
    
    // Get sync logs for last sync
    const syncLogsTransaction = db.transaction([STORES.syncLogs], 'readonly');
    const syncLogsStore = syncLogsTransaction.objectStore(STORES.syncLogs);
    const syncLogsIndex = syncLogsStore.index('timestamp');
    
    // Run all queries in parallel
    const [
      sessionsTotal,
      sessionsUnsynced,
      interviewsTotal,
      interviewsUnsynced,
      currentLock,
      lastSyncLog
    ] = await Promise.all([
      new Promise<number>((resolve) => {
        const request = sessionsStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
      new Promise<number>((resolve) => {
        const request = sessionsSyncIndex.count(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
      new Promise<number>((resolve) => {
        const request = interviewsStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
      new Promise<number>((resolve) => {
        const request = interviewsSyncIndex.count(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
      new Promise<any>((resolve) => {
        const request = syncLocksStore.get('main');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      }),
      new Promise<any>((resolve) => {
        // Get most recent successful sync completion log
        const request = syncLogsStore.openCursor(null, 'prev');
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && cursor.value.category === 'SyncOperation' && cursor.value.status === 'success') {
            resolve(cursor.value.timestamp);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      })
    ]);
    
    // Get in-progress counts (syncing but not yet complete)
    const sessionsInProgress = await new Promise<number>((resolve) => {
      // Check for sessions with syncInProgress flag
      const request = sessionsStore.openCursor();
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.syncInProgress === true && !cursor.value.synced) {
            count++;
          }
          cursor.continue();
        } else {
          resolve(count);
        }
      };
      
      request.onerror = () => {
        resolve(0);
      };
    });
    
    const interviewsInProgress = await new Promise<number>((resolve) => {
      // Check for interviews with syncInProgress flag
      const request = interviewsStore.openCursor();
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.syncInProgress === true && !cursor.value.synced) {
            count++;
          }
          cursor.continue();
        } else {
          resolve(count);
        }
      };
      
      request.onerror = () => {
        resolve(0);
      };
    });
    
    return {
      sessionsTotal,
      sessionsUnsynced,
      sessionsInProgress,
      interviewsTotal,
      interviewsUnsynced,
      interviewsInProgress,
      lastSync: lastSyncLog,
      currentLock
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
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

// Log sync operation
export const logSync = async (
  category: string, 
  operation: string, 
  status: 'success' | 'error' | 'warning' | 'info',
  details: string
): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readwrite');
    const store = transaction.objectStore(STORES.syncLogs);
    
    const logEntry = {
      category,
      operation,
      status,
      details,
      timestamp: new Date().toISOString(),
      metadata: {
        deviceId: localStorage.getItem('device_id') || 'unknown',
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(logEntry);
      
      request.onsuccess = () => {
        const logId = request.result as number;
        console.log(`Logged sync operation: [${category}] ${operation} - ${status}`);
        resolve(logId);
      };
      
      request.onerror = (error) => {
        console.error('Error logging sync operation:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Fatal error logging sync operation:', error);
    throw error;
  }
};

// Get sync logs
export const getSyncLogs = async (limit: number = 100): Promise<any[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.syncLogs], 'readonly');
    const store = transaction.objectStore(STORES.syncLogs);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const logs: any[] = [];
      
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
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

// Mark a session as sync in progress
export const markSessionSyncInProgress = async (sessionId: number, inProgress: boolean): Promise<void> => {
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
        
        session.syncInProgress = inProgress;
        session.lastSyncAttempt = new Date().toISOString();
        
        const updateRequest = store.put(session);
        
        updateRequest.onsuccess = () => {
          console.log(`Marked session ${sessionId} sync in progress: ${inProgress}`);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error(`Error marking session ${sessionId} sync in progress:`, error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error(`Error fetching session ${sessionId} for sync marking:`, error);
        reject(error);
      };
    });
  } catch (error) {
    console.error(`Fatal error marking session ${sessionId} sync in progress:`, error);
    throw error;
  }
};

// Mark an interview as sync in progress
export const markInterviewSyncInProgress = async (interviewId: number, inProgress: boolean): Promise<void> => {
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
        
        interview.syncInProgress = inProgress;
        interview.lastSyncAttempt = new Date().toISOString();
        
        const updateRequest = store.put(interview);
        
        updateRequest.onsuccess = () => {
          console.log(`Marked interview ${interviewId} sync in progress: ${inProgress}`);
          resolve();
        };
        
        updateRequest.onerror = (error) => {
          console.error(`Error marking interview ${interviewId} sync in progress:`, error);
          reject(error);
        };
      };
      
      request.onerror = (error) => {
        console.error(`Error fetching interview ${interviewId} for sync marking:`, error);
        reject(error);
      };
    });
  } catch (error) {
    console.error(`Fatal error marking interview ${interviewId} sync in progress:`, error);
    throw error;
  }
};

// Synchronize offline sessions and interviews
export const syncOfflineSessions = async (): Promise<boolean> => {
  // Only sync when online
  if (!isOnline()) {
    console.log('Cannot sync while offline');
    return false;
  }
  
  // Try to acquire the sync lock
  const syncId = `manual-sync-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const lockAcquired = await acquireSyncLock(syncId);
  
  if (!lockAcquired) {
    console.log('Sync already in progress, skipping');
    await logSync('SyncOperation', 'Skipped', 'warning', 'Sync already in progress');
    return false;
  }
  
  try {
    // Log sync start
    await logSync('SyncOperation', 'Started', 'info', 'Starting sync operation');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Get unsynchronized sessions
    const unsyncedSessions = await getUnsyncedSessions();
    console.log(`Found ${unsyncedSessions.length} unsynced sessions`);
    
    // Process sessions in sequence to avoid race conditions
    for (const session of unsyncedSessions) {
      try {
        // Mark session as sync in progress
        await markSessionSyncInProgress(session.id, true);
        
        // Generate a unique key if not present
        if (!session.uniqueKey) {
          session.uniqueKey = generateSessionUniqueKey(session);
          // Update the session with the new uniqueKey
          const db = await openDB();
          const transaction = db.transaction([STORES.sessions], 'readwrite');
          const store = transaction.objectStore(STORES.sessions);
          session.updatedAt = new Date().toISOString();
          await store.put(session);
        }
        
        // Check if the session already exists online
        const existingSessionId = await checkSessionExists(session.uniqueKey);
        
        if (existingSessionId) {
          console.log(`Session ${session.id} already exists online with ID ${existingSessionId}`);
          await markSessionAsSynced(session.id, existingSessionId);
          await markSessionSyncInProgress(session.id, false);
          
          // Log duplicate found
          await logSync('SessionSync', 'DuplicateFound', 'info', 
            `Session ${session.id} matches online session ${existingSessionId}`);
          
          continue;
        }
        
        // Get the interviewer ID
        const interviewer = await getInterviewerByCode(session.interviewerCode);
        
        if (!interviewer) {
          console.error(`Cannot sync session ${session.id}: Interviewer not found`);
          await markSessionSyncInProgress(session.id, false);
          
          // Log error
          await logSync('SessionSync', 'Error', 'error', 
            `Cannot sync session ${session.id}: Interviewer ${session.interviewerCode} not found`);
          
          continue;
        }
        
        // Prepare session data for upload
        const sessionData = {
          interviewer_id: interviewer.id,
          project_id: session.projectId || null,
          start_time: session.startTime,
          end_time: session.endTime || null,
          start_latitude: session.startLatitude || null,
          start_longitude: session.startLongitude || null,
          start_address: session.startAddress || null,
          end_latitude: session.endLatitude || null,
          end_longitude: session.endLongitude || null,
          end_address: session.endAddress || null,
          is_active: session.isActive || false,
          unique_key: session.uniqueKey, // New field for deduplication
          offline_created_at: session.createdAt || new Date().toISOString()
        };
        
        // Upload the session
        const { data: sessionResult, error } = await supabase
          .from('sessions')
          .insert([sessionData])
          .select();
          
        if (error) {
          console.error(`Error syncing session ${session.id}:`, error);
          await markSessionSyncInProgress(session.id, false);
          
          // Log error
          await logSync('SessionSync', 'Error', 'error', 
            `Error syncing session ${session.id}: ${error.message}`);
          
          continue;
        }
        
        if (!sessionResult || sessionResult.length === 0) {
          console.error(`No data returned when syncing session ${session.id}`);
          await markSessionSyncInProgress(session.id, false);
          
          // Log error
          await logSync('SessionSync', 'Error', 'error', 
            `No data returned when syncing session ${session.id}`);
          
          continue;
        }
        
        const onlineSessionId = sessionResult[0].id;
        
        // Mark session as synced
        await markSessionAsSynced(session.id, onlineSessionId);
        
        // Log success
        await logSync('SessionSync', 'Success', 'success', 
          `Synced session ${session.id} to online ID ${onlineSessionId}`);
        
        console.log(`Synced session ${session.id} to online ID ${onlineSessionId}`);
        
        // Get interviews for this session
        const sessionInterviews = await getInterviewsForOfflineSession(session.id);
        console.log(`Found ${sessionInterviews.length} interviews for session ${session.id}`);
        
        // Process interviews
        for (const interview of sessionInterviews) {
          try {
            // Mark interview as sync in progress
            await markInterviewSyncInProgress(interview.id, true);
            
            // Generate a unique key if not present
            if (!interview.uniqueKey) {
              interview.uniqueKey = generateInterviewUniqueKey(interview);
              // Update the interview with the new uniqueKey
              const db = await openDB();
              const transaction = db.transaction([STORES.interviews], 'readwrite');
              const store = transaction.objectStore(STORES.interviews);
              interview.updatedAt = new Date().toISOString();
              await store.put(interview);
            }
            
            // Check if the interview already exists online
            const existingInterviewId = await checkInterviewExists(interview.uniqueKey);
            
            if (existingInterviewId) {
              console.log(`Interview ${interview.id} already exists online with ID ${existingInterviewId}`);
              await markInterviewAsSynced(interview.id, existingInterviewId);
              await markInterviewSyncInProgress(interview.id, false);
              
              // Log duplicate found
              await logSync('InterviewSync', 'DuplicateFound', 'info', 
                `Interview ${interview.id} matches online interview ${existingInterviewId}`);
              
              continue;
            }
            
            // Prepare interview data for upload
            const interviewData = {
              session_id: onlineSessionId,
              project_id: interview.projectId || null,
              start_time: interview.startTime,
              end_time: interview.endTime || null,
              start_latitude: interview.startLatitude || null,
              start_longitude: interview.startLongitude || null,
              start_address: interview.startAddress || null,
              end_latitude: interview.endLatitude || null,
              end_longitude: interview.endLongitude || null,
              end_address: interview.endAddress || null,
              is_active: interview.endTime ? false : true,
              candidate_name: interview.candidateName || "Unknown",
              result: interview.result,
              unique_key: interview.uniqueKey,
              offline_created_at: interview.createdAt || new Date().toISOString()
            };
            
            // Upload the interview
            const { data: uploadResult, error: interviewError } = await supabase
              .from('interviews')
              .insert([interviewData])
              .select();
              
            if (interviewError) {
              console.error(`Error syncing interview ${interview.id}:`, interviewError);
              await markInterviewSyncInProgress(interview.id, false);
              
              // Log error
              await logSync('InterviewSync', 'Error', 'error', 
                `Error syncing interview ${interview.id}: ${interviewError.message}`);
              
              continue;
            }
            
            if (!uploadResult || uploadResult.length === 0) {
              console.error(`No data returned when syncing interview ${interview.id}`);
              await markInterviewSyncInProgress(interview.id, false);
              
              // Log error
              await logSync('InterviewSync', 'Error', 'error', 
                `No data returned when syncing interview ${interview.id}`);
              
              continue;
            }
            
            const onlineInterviewId = uploadResult[0].id;
            
            // Mark interview as synced
            await markInterviewAsSynced(interview.id, onlineInterviewId);
            
            // Log success
            await logSync('InterviewSync', 'Success', 'success', 
              `Synced interview ${interview.id} to online ID ${onlineInterviewId}`);
            
            console.log(`Synced interview ${interview.id} to online ID ${onlineInterviewId}`);
          } catch (interviewError) {
            console.error(`Error processing interview ${interview.id}:`, interviewError);
            await markInterviewSyncInProgress(interview.id, false);
            
            // Log error
            await logSync('InterviewSync', 'Error', 'error', 
              `Error processing interview ${interview.id}: ${interviewError}`);
          }
        }
        
        // Mark session as sync complete
        await markSessionSyncInProgress(session.id, false);
      } catch (sessionError) {
        console.error(`Error processing session ${session.id}:`, sessionError);
        await markSessionSyncInProgress(session.id, false);
        
        // Log error
        await logSync('SessionSync', 'Error', 'error', 
          `Error processing session ${session.id}: ${sessionError}`);
      }
    }
    
    // Log sync completion
    await logSync('SyncOperation', 'Completed', 'success', 
      `Completed sync operation - Processed ${unsyncedSessions.length} sessions`);
    
    return true;
  } catch (error) {
    console.error('Error during sync operation:', error);
    
    // Log error
    await logSync('SyncOperation', 'Failed', 'error', 
      `Error during sync operation: ${error}`);
    
    return false;
  } finally {
    // Always release the sync lock
    await releaseSyncLock(syncId);
  }
};

// Export for use in other modules
export default {
  isOnline,
  saveOfflineSession,
  updateOfflineSession,
  saveOfflineInterview,
  updateOfflineInterview,
  updateOfflineInterviewResult,
  getUnsyncedSessions,
  getUnsyncedSessionsCount,
  getUnsyncedInterviews,
  getUnsyncedInterviewsCount,
  getInterviewsForOfflineSession,
  getOfflineInterview,
  syncOfflineSessions,
  cacheInterviewer,
  getInterviewerByCode,
  cacheProjects,
  getCachedProjects,
  acquireSyncLock,
  releaseSyncLock,
  forceReleaseSyncLock,
  getSyncStatus,
  logSync,
  getSyncLogs
};
