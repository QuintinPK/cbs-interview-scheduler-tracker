import { Session, Interview, Interviewer, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { DBSession, DBInterview, DBInterviewer, DBProject, DBProjectInterviewer } from './offlineStorage.types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SyncStatus {
  lastSuccessfulSync: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSync: number;
}

const DB_NAME = 'cbs_offline_db';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBRequest<IDBDatabase>).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest<IDBDatabase>).result;

      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionsStore.createIndex('interviewer_id', 'interviewer_id', { unique: false });
        sessionsStore.createIndex('project_id', 'project_id', { unique: false });
        sessionsStore.createIndex('is_active', 'is_active', { unique: false });
        sessionsStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      if (!db.objectStoreNames.contains('interviews')) {
        const interviewsStore = db.createObjectStore('interviews', { keyPath: 'id' });
        interviewsStore.createIndex('session_id', 'session_id', { unique: false });
        interviewsStore.createIndex('project_id', 'project_id', { unique: false });
        interviewsStore.createIndex('is_active', 'is_active', { unique: false });
        interviewsStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      if (!db.objectStoreNames.contains('interviewers')) {
        const interviewersStore = db.createObjectStore('interviewers', { keyPath: 'id' });
        interviewersStore.createIndex('code', 'code', { unique: true });
      }

      if (!db.objectStoreNames.contains('projects')) {
        const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('project_interviewers')) {
        const projectInterviewersStore = db.createObjectStore('project_interviewers', { keyPath: 'id', autoIncrement: true });
        projectInterviewersStore.createIndex('interviewer_id', 'interviewer_id', { unique: false });
        projectInterviewersStore.createIndex('project_id', 'project_id', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('sync_status')) {
        const syncStatusStore = db.createObjectStore('sync_status', { keyPath: 'id' });
      }
    };
  });
};

const executeTransaction = (
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<any>
): Promise<any> => {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      callback(store)
        .then(resolve)
        .catch(reject);
    });
  });
};

export const saveSessionLocally = async (session: Session): Promise<Session> => {
  const dbSession: DBSession = {
    ...session,
    start_latitude: session.start_latitude !== undefined ? session.start_latitude : null,
    start_longitude: session.start_longitude !== undefined ? session.start_longitude : null,
    end_latitude: session.end_latitude !== undefined ? session.end_latitude : null,
    end_longitude: session.end_longitude !== undefined ? session.end_longitude : null,
  };
  
  await executeTransaction('sessions', 'readwrite', async (store) => {
    await store.put(dbSession);
  });
  return session;
};

export const getLocalSessions = async (): Promise<Session[]> => {
  return executeTransaction('sessions', 'readonly', async (store) => {
    const request = store.getAll();
    return new Promise<Session[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Session[]);
      request.onerror = () => reject(request.error);
    });
  });
};

export const getLocalSessionById = async (id: string): Promise<Session | null> => {
  return executeTransaction('sessions', 'readonly', async (store) => {
    const request = store.get(id);
    return new Promise<Session | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ? request.result as Session : null);
      request.onerror = () => reject(request.error);
    });
  });
};

export const updateLocalSession = async (session: Session): Promise<Session> => {
  const dbSession: DBSession = {
    ...session,
    start_latitude: session.start_latitude !== undefined ? session.start_latitude : null,
    start_longitude: session.start_longitude !== undefined ? session.start_longitude : null,
    end_latitude: session.end_latitude !== undefined ? session.end_latitude : null,
    end_longitude: session.end_longitude !== undefined ? session.end_longitude : null,
  };
  
  await executeTransaction('sessions', 'readwrite', async (store) => {
    await store.put(dbSession);
  });
  return session;
};

export const saveInterviewLocally = async (interview: Interview): Promise<Interview> => {
  const dbInterview: DBInterview = {
    ...interview,
    start_latitude: interview.start_latitude !== undefined ? interview.start_latitude : null,
    start_longitude: interview.start_longitude !== undefined ? interview.start_longitude : null,
    end_latitude: interview.end_latitude !== undefined ? interview.end_latitude : null,
    end_longitude: interview.end_longitude !== undefined ? interview.end_longitude : null,
  };
  
  await executeTransaction('interviews', 'readwrite', async (store) => {
    await store.put(dbInterview);
  });
  return interview;
};

export const getLocalInterviews = async (): Promise<Interview[]> => {
  return executeTransaction('interviews', 'readonly', async (store) => {
    const request = store.getAll();
    return new Promise<Interview[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Interview[]);
      request.onerror = () => reject(request.error);
    });
  });
};

export const getLocalInterviewsForSession = async (sessionId: string): Promise<Interview[]> => {
  return executeTransaction('interviews', 'readonly', async (store) => {
    const index = store.index('session_id');
    const request = index.getAll(sessionId);
    return new Promise<Interview[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Interview[]);
      request.onerror = () => reject(request.error);
    });
  });
};

export const updateLocalInterview = async (interview: Interview): Promise<Interview> => {
  const dbInterview: DBInterview = {
    ...interview,
    start_latitude: interview.start_latitude !== undefined ? interview.start_latitude : null,
    start_longitude: interview.start_longitude !== undefined ? interview.start_longitude : null,
    end_latitude: interview.end_latitude !== undefined ? interview.end_latitude : null,
    end_longitude: interview.end_longitude !== undefined ? interview.end_longitude : null,
  };
  
  await executeTransaction('interviews', 'readwrite', async (store) => {
    await store.put(dbInterview);
  });
  return interview;
};

export const saveInterviewer = async (interviewer: Interviewer): Promise<Interviewer> => {
  const dbInterviewer: DBInterviewer = {
    ...interviewer,
  };
  
  await executeTransaction('interviewers', 'readwrite', async (store) => {
    await store.put(dbInterviewer);
  });
  return interviewer;
};

export const getInterviewers = async (): Promise<Interviewer[]> => {
  return executeTransaction('interviewers', 'readonly', async (store) => {
    const request = store.getAll();
    return new Promise<Interviewer[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Interviewer[]);
      request.onerror = () => reject(request.error);
    });
  });
};

export const getInterviewerByCode = async (code: string): Promise<Interviewer | null> => {
  return executeTransaction('interviewers', 'readonly', async (store) => {
    const index = store.index('code');
    const request = index.get(code);
    return new Promise<Interviewer | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ? request.result as Interviewer : null);
      request.onerror = () => reject(request.error);
    });
  });
};

export const saveProject = async (project: Project): Promise<Project> => {
  const dbProject: DBProject = {
    ...project,
  };
  
  await executeTransaction('projects', 'readwrite', async (store) => {
    await store.put(dbProject);
  });
  return project;
};

export const getProjects = async (): Promise<Project[]> => {
  return executeTransaction('projects', 'readonly', async (store) => {
    const request = store.getAll();
    return new Promise<Project[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Project[]);
      request.onerror = () => reject(request.error);
    });
  });
};

export const saveInterviewerProjects = async (interviewerId: string, projects: Project[]): Promise<void> => {
  await executeTransaction('project_interviewers', 'readwrite', async (store) => {
    const index = store.index('interviewer_id');
    const existingKeysRequest = index.getAllKeys(interviewerId);
    
    return new Promise<void>((resolve, reject) => {
      existingKeysRequest.onsuccess = async () => {
        const keys = existingKeysRequest.result;
        
        for (const key of keys) {
          await store.delete(key);
        }
        
        for (const project of projects) {
          const dbProjectInterviewer: DBProjectInterviewer = {
            interviewer_id: interviewerId,
            project_id: project.id,
          };
          await store.put(dbProjectInterviewer);
        }
        
        resolve();
      };
      existingKeysRequest.onerror = () => reject(existingKeysRequest.error);
    });
  });
};

export const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
  return executeTransaction('project_interviewers', 'readonly', async (store) => {
    const index = store.index('interviewer_id');
    const request = index.getAll(interviewerId);
    
    return new Promise<Project[]>((resolve, reject) => {
      request.onsuccess = async () => {
        const projectInterviewers = request.result as DBProjectInterviewer[];
        
        const allProjects = await getProjects();
        
        const projects = allProjects.filter(project => 
          projectInterviewers.some(pi => pi.project_id === project.id)
        );
        
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

export const initSyncStatus = async (): Promise<SyncStatus> => {
  let status: SyncStatus | null = null;
  
  try {
    status = await getSyncStatus();
  } catch (error) {
    console.warn("Could not retrieve existing sync status, initializing a new one");
  }
  
  if (status) {
    return status;
  }
  
  const newStatus: SyncStatus = {
    lastSuccessfulSync: null,
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingSync: 0
  };
  
  await executeTransaction('sync_status', 'readwrite', async (store) => {
    await store.put({id: 'sync_status', ...newStatus});
  });
  
  return newStatus;
};

export const getSyncStatus = async (): Promise<SyncStatus | null> => {
  return executeTransaction('sync_status', 'readonly', async (store) => {
    const request = store.get('sync_status');
    return new Promise<SyncStatus | null>((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          const { id, ...syncStatus } = request.result;
          resolve(syncStatus as SyncStatus);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  });
};

export const updateSyncStatus = async (updates: Partial<SyncStatus>): Promise<SyncStatus> => {
  const currentStatus = await getSyncStatus() || {
    lastSuccessfulSync: null,
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingSync: 0
  };
  
  const updatedStatus: SyncStatus = {
    ...currentStatus,
    ...updates
  };
  
  await executeTransaction('sync_status', 'readwrite', async (store) => {
    await store.put({id: 'sync_status', ...updatedStatus});
  });
  
  return updatedStatus;
};

export const syncAll = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await updateSyncStatus({ isSyncing: true });
    
    const sessions = await getLocalSessions();
    const interviews = await getLocalInterviews();
    
    const unsyncedSessions = sessions.filter(s => s.sync_status === 'unsynced');
    const unsyncedInterviews = interviews.filter(i => i.sync_status === 'unsynced');
    
    console.log(`Found ${unsyncedSessions.length} unsynced sessions and ${unsyncedInterviews.length} unsynced interviews`);
    
    for (const session of unsyncedSessions) {
      if (!session.interviewer_id || !session.project_id) {
        console.warn(`Skipping session ${session.id} due to missing interviewer_id or project_id`);
        continue;
      }
      
      if (session.id.includes('-')) {
        await updateLocalSession({ ...session, sync_status: 'synced' });
        continue;
      }
      
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          id: session.id,
          interviewer_id: session.interviewer_id,
          project_id: session.project_id,
          start_time: session.start_time,
          end_time: session.end_time,
          start_latitude: session.start_latitude,
          start_longitude: session.start_longitude,
          start_address: session.start_address,
          end_latitude: session.end_latitude,
          end_longitude: session.end_longitude,
          end_address: session.end_address,
          is_active: session.is_active,
          is_unusual_reviewed: session.is_unusual_reviewed
        }])
        .select()
        .single();
        
      if (error) {
        console.error(`Error syncing session ${session.id}:`, error);
        return { success: false, message: `Failed to sync session: ${error.message}` };
      }
      
      await updateLocalSession({ ...session, sync_status: 'synced', id: data.id });
    }
    
    for (const interview of unsyncedInterviews) {
      if (!interview.session_id || !interview.project_id) {
        console.warn(`Skipping interview ${interview.id} due to missing session_id or project_id`);
        continue;
      }
      
      if (interview.id.includes('-')) {
        await updateLocalInterview({ ...interview, sync_status: 'synced' });
        continue;
      }
      
      const { data, error } = await supabase
        .from('interviews')
        .insert([{
          id: interview.id,
          session_id: interview.session_id,
          project_id: interview.project_id,
          start_time: interview.start_time,
          end_time: interview.end_time,
          start_latitude: interview.start_latitude,
          start_longitude: interview.start_longitude,
          start_address: interview.start_address,
          end_latitude: interview.end_latitude,
          end_longitude: interview.end_longitude,
          end_address: interview.end_address,
          result: interview.result,
          is_active: interview.is_active
        }])
        .select()
        .single();
        
      if (error) {
        console.error(`Error syncing interview ${interview.id}:`, error);
        return { success: false, message: `Failed to sync interview: ${error.message}` };
      }
      
      await updateLocalInterview({ ...interview, sync_status: 'synced', id: data.id });
    }
    
    await updateSyncStatus({
      lastSuccessfulSync: new Date().toISOString(),
      isSyncing: false,
      pendingSync: 0
    });
    
    console.log('Sync completed successfully');
    return { success: true, message: 'Sync completed successfully' };
  } catch (error: any) {
    console.error('Sync failed:', error);
    await updateSyncStatus({ isSyncing: false });
    return { success: false, message: `Sync failed: ${error.message}` };
  }
};

export const setupConnectivityListeners = (
  onOnline: () => Promise<void>,
  onOffline: () => Promise<void>
): () => void => {
  const handleOnline = async () => {
    console.log('Online');
    await updateSyncStatus({ isOnline: true });
    await onOnline();
  };
  
  const handleOffline = async () => {
    console.log('Offline');
    await updateSyncStatus({ isOnline: false });
    await onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  if (navigator.onLine) {
    handleOnline();
  } else {
    handleOffline();
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export const setupAutoSync = (
  onSyncStart: () => void,
  onSyncComplete: (result: { success: boolean; message: string }) => void,
  interval: number
): () => void => {
  let syncInterval: NodeJS.Timeout | null = null;
  
  const sync = async () => {
    const status = await getSyncStatus();
    
    if (!status?.isOnline || status?.isSyncing) {
      return;
    }
    
    onSyncStart();
    const result = await syncAll();
    onSyncComplete(result);
  };
  
  syncInterval = setInterval(sync, interval);
  
  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient<any, "public", any>;

export const initSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required.');
  }

  supabase = new SupabaseClient(supabaseUrl, supabaseKey);
  return supabase;
};
