
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { Session, Interview, Interviewer, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Define SyncStatus interface
export interface SyncStatus {
  lastSyncAttempt: string;
  lastSuccessfulSync: string | null;
  isOnline: boolean;
  isSyncing: boolean;
}

// Initialize local storage instances
const sessionsStorage = localforage.createInstance({
  name: 'cbs-interviewer',
  storeName: 'sessions'
});

const interviewsStorage = localforage.createInstance({
  name: 'cbs-interviewer',
  storeName: 'interviews'
});

const interviewersStorage = localforage.createInstance({
  name: 'cbs-interviewer',
  storeName: 'interviewers'
});

const projectsStorage = localforage.createInstance({
  name: 'cbs-interviewer',
  storeName: 'projects'
});

// Sync status tracking
const syncStatusStorage = localforage.createInstance({
  name: 'cbs-interviewer',
  storeName: 'syncStatus'
});

// Initial sync status
const initialSyncStatus: SyncStatus = {
  lastSyncAttempt: new Date().toISOString(),
  lastSuccessfulSync: null,
  isOnline: navigator.onLine,
  isSyncing: false
};

// Session operations
export const saveSessionLocally = async (session: Session): Promise<Session> => {
  const sessionToSave = { 
    ...session,
    sync_status: 'unsynced' as 'unsynced',
    local_id: session.local_id || uuidv4()
  };
  
  await sessionsStorage.setItem(sessionToSave.local_id, sessionToSave);
  return sessionToSave;
};

export const getLocalSessions = async (): Promise<Session[]> => {
  const sessions: Session[] = [];
  
  await sessionsStorage.iterate((value: Session) => {
    sessions.push(value);
  });
  
  return sessions;
};

export const getLocalSessionById = async (id: string): Promise<Session | null> => {
  // Try to find by local_id first
  const session = await sessionsStorage.getItem<Session>(id);
  if (session) return session;
  
  // If not found, search all sessions for matching server id
  const allSessions = await getLocalSessions();
  return allSessions.find(s => s.id === id) || null;
};

export const updateLocalSession = async (session: Session): Promise<Session> => {
  if (!session.local_id) {
    throw new Error('Cannot update session without local_id');
  }
  
  await sessionsStorage.setItem(session.local_id, session);
  return session;
};

export const removeLocalSession = async (id: string): Promise<void> => {
  await sessionsStorage.removeItem(id);
};

// Interview operations
export const saveInterviewLocally = async (interview: Interview): Promise<Interview> => {
  const interviewToSave = {
    ...interview,
    sync_status: 'unsynced' as 'unsynced',
    local_id: interview.local_id || uuidv4() 
  };
  
  await interviewsStorage.setItem(interviewToSave.local_id, interviewToSave);
  return interviewToSave;
};

export const getLocalInterviews = async (): Promise<Interview[]> => {
  const interviews: Interview[] = [];
  
  await interviewsStorage.iterate((value: Interview) => {
    interviews.push(value);
  });
  
  return interviews;
};

export const getLocalInterviewsForSession = async (sessionId: string): Promise<Interview[]> => {
  const allInterviews = await getLocalInterviews();
  return allInterviews.filter(interview => interview.session_id === sessionId);
};

export const updateLocalInterview = async (interview: Interview): Promise<Interview> => {
  if (!interview.local_id) {
    throw new Error('Cannot update interview without local_id');
  }
  
  await interviewsStorage.setItem(interview.local_id, interview);
  return interview;
};

export const removeLocalInterview = async (id: string): Promise<void> => {
  await interviewsStorage.removeItem(id);
};

// Interviewer operations
export const saveInterviewer = async (interviewer: Interviewer): Promise<Interviewer> => {
  await interviewersStorage.setItem(interviewer.id, interviewer);
  return interviewer;
};

export const getInterviewers = async (): Promise<Interviewer[]> => {
  const interviewers: Interviewer[] = [];
  
  await interviewersStorage.iterate((value: Interviewer) => {
    interviewers.push(value);
  });
  
  return interviewers;
};

export const getInterviewerByCode = async (code: string): Promise<Interviewer | null> => {
  const interviewers = await getInterviewers();
  return interviewers.find(i => i.code === code) || null;
};

// Project operations
export const saveProject = async (project: Project): Promise<Project> => {
  await projectsStorage.setItem(project.id, project);
  return project;
};

export const getProjects = async (): Promise<Project[]> => {
  const projects: Project[] = [];
  
  await projectsStorage.iterate((value: Project) => {
    projects.push(value);
  });
  
  return projects;
};

export const saveInterviewerProjects = async (interviewerId: string, projects: Project[]): Promise<void> => {
  await projectsStorage.setItem(`interviewer_${interviewerId}_projects`, projects);
};

export const getInterviewerProjects = async (interviewerId: string): Promise<Project[]> => {
  const projects = await projectsStorage.getItem<Project[]>(`interviewer_${interviewerId}_projects`);
  return projects || [];
};

// Sync status operations
export const initSyncStatus = async (): Promise<SyncStatus> => {
  const status = await syncStatusStorage.getItem<SyncStatus>('syncStatus');
  if (!status) {
    await syncStatusStorage.setItem('syncStatus', initialSyncStatus);
    return initialSyncStatus;
  }
  return status;
};

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const status = await syncStatusStorage.getItem<SyncStatus>('syncStatus');
  return status || initialSyncStatus;
};

export const updateSyncStatus = async (updates: Partial<SyncStatus>): Promise<SyncStatus> => {
  const currentStatus = await getSyncStatus();
  const updatedStatus = { ...currentStatus, ...updates };
  await syncStatusStorage.setItem('syncStatus', updatedStatus);
  return updatedStatus;
};

// Synchronization logic
export const syncAll = async (): Promise<{ success: boolean; message: string }> => {
  // Update sync status
  await updateSyncStatus({ 
    lastSyncAttempt: new Date().toISOString(),
    isSyncing: true
  });
  
  if (!navigator.onLine) {
    await updateSyncStatus({ isSyncing: false });
    return { success: false, message: 'No internet connection' };
  }
  
  try {
    // Sync sessions first
    const unsyncedSessions = await getLocalSessions();
    const sessionsToSync = unsyncedSessions.filter(s => s.sync_status === 'unsynced');
    
    for (const session of sessionsToSync) {
      // Update status to syncing
      await updateLocalSession({ ...session, sync_status: 'syncing' });
      
      // Prepare data for server
      const sessionData = { ...session };
      delete sessionData.sync_status;
      delete sessionData.local_id;
      
      // Check if session has a server ID already
      if (session.id && session.id.length > 10) {
        // Update existing session
        const { error } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', session.id);
          
        if (error) {
          console.error('Error updating session:', error);
          await updateLocalSession({ ...session, sync_status: 'unsynced' });
          continue;
        }
      } else {
        // Insert new session
        const { data, error } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select()
          .single();
          
        if (error) {
          console.error('Error inserting session:', error);
          await updateLocalSession({ ...session, sync_status: 'unsynced' });
          continue;
        }
        
        // Update local session with server ID
        await updateLocalSession({ 
          ...session, 
          id: data.id,
          sync_status: 'synced' 
        });
      }
    }
    
    // Now sync interviews
    const unsyncedInterviews = await getLocalInterviews();
    const interviewsToSync = unsyncedInterviews.filter(i => i.sync_status === 'unsynced');
    
    for (const interview of interviewsToSync) {
      // Update status to syncing
      await updateLocalInterview({ ...interview, sync_status: 'syncing' });
      
      // Check if the interview's session has been synced
      const sessionLocalId = interview.session_id;
      const session = await getLocalSessionById(sessionLocalId);
      
      if (!session || session.sync_status !== 'synced') {
        // Can't sync interview without synced session
        await updateLocalInterview({ ...interview, sync_status: 'unsynced' });
        continue;
      }
      
      // Prepare data for server
      const interviewData = { 
        ...interview,
        session_id: session.id // Use server session ID
      };
      delete interviewData.sync_status;
      delete interviewData.local_id;
      
      // Check if interview has a server ID already
      if (interview.id && interview.id.length > 10) {
        // Update existing interview
        const { error } = await supabase
          .from('interviews')
          .update(interviewData)
          .eq('id', interview.id);
          
        if (error) {
          console.error('Error updating interview:', error);
          await updateLocalInterview({ ...interview, sync_status: 'unsynced' });
          continue;
        }
      } else {
        // Insert new interview
        const { data, error } = await supabase
          .from('interviews')
          .insert(interviewData)
          .select()
          .single();
          
        if (error) {
          console.error('Error inserting interview:', error);
          await updateLocalInterview({ ...interview, sync_status: 'unsynced' });
          continue;
        }
        
        // Update local interview with server ID
        await updateLocalInterview({ 
          ...interview, 
          id: data.id,
          sync_status: 'synced' 
        });
      }
    }
    
    // Update sync status
    await updateSyncStatus({ 
      lastSuccessfulSync: new Date().toISOString(),
      isSyncing: false,
      isOnline: true
    });
    
    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    console.error('Sync error:', error);
    
    // Update sync status
    await updateSyncStatus({ isSyncing: false });
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error during sync' 
    };
  }
};

// Setup online status listeners
export const setupConnectivityListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
) => {
  const handleOnline = async () => {
    await updateSyncStatus({ isOnline: true });
    onlineCallback();
  };
  
  const handleOffline = async () => {
    await updateSyncStatus({ isOnline: false });
    offlineCallback();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Auto-sync when coming online
export const setupAutoSync = (
  onSyncStart: () => void,
  onSyncComplete: (result: { success: boolean; message: string }) => void,
  syncInterval: number = 60000 // Default: 1 minute
) => {
  // Sync when coming online
  const handleOnline = async () => {
    onSyncStart();
    const result = await syncAll();
    onSyncComplete(result);
  };
  
  window.addEventListener('online', handleOnline);
  
  // Also set up periodic sync
  const intervalId = setInterval(async () => {
    if (navigator.onLine) {
      const syncStatus = await getSyncStatus();
      if (!syncStatus.isSyncing) {
        onSyncStart();
        const result = await syncAll();
        onSyncComplete(result);
      }
    }
  }, syncInterval);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
};
