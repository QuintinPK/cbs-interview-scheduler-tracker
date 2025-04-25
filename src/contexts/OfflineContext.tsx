import React, { createContext, useContext, useEffect, useState } from 'react';
import { Interview, Session, Interviewer, Project } from '@/types';
import { 
  saveSessionLocally, 
  getLocalSessions, 
  updateLocalSession, 
  getLocalSessionById,
  saveInterviewLocally, 
  getLocalInterviews, 
  updateLocalInterview,
  getLocalInterviewsForSession,
  saveInterviewer,
  getInterviewers,
  getInterviewerByCode,
  saveProject,
  getProjects,
  saveInterviewerProjects,
  getInterviewerProjects,
  SyncStatus,
  initSyncStatus,
  updateSyncStatus,
  getSyncStatus,
  syncAll,
  setupConnectivityListeners,
  setupAutoSync
} from '@/services/offlineStorage';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextType {
  isOnline: boolean;
  syncStatus: SyncStatus | null;
  sessions: Session[];
  saveSession: (session: Session) => Promise<Session>;
  getSessionById: (id: string) => Promise<Session | null>;
  updateSession: (session: Session) => Promise<Session>;
  saveInterview: (interview: Interview) => Promise<Interview>;
  getInterviews: () => Promise<Interview[]>;
  getInterviewsForSession: (sessionId: string) => Promise<Interview[]>;
  updateInterview: (interview: Interview) => Promise<Interview>;
  saveInterviewer: (interviewer: Interviewer) => Promise<Interviewer>;
  getInterviewers: () => Promise<Interviewer[]>;
  getInterviewerByCode: (code: string) => Promise<Interviewer | null>;
  saveProject: (project: Project) => Promise<Project>;
  getProjects: () => Promise<Project[]>;
  saveInterviewerProjects: (interviewerId: string, projects: Project[]) => Promise<void>;
  getInterviewerProjects: (interviewerId: string) => Promise<Project[]>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  refreshSessions: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const status = await initSyncStatus();
        setSyncStatus(status);
        
        await refreshSessions();
      } catch (error) {
        console.error('Error initializing offline storage:', error);
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    const cleanup = setupConnectivityListeners(
      async () => {
        setIsOnline(true);
        setSyncStatus(prev => prev ? { ...prev, isOnline: true } : null);
        toast({
          title: "You are online",
          description: "Your data will be synchronized automatically",
        });
      },
      async () => {
        setIsOnline(false);
        setSyncStatus(prev => prev ? { ...prev, isOnline: false } : null);
        toast({
          title: "You are offline",
          description: "Your data will be saved locally",
          variant: "destructive",
        });
      }
    );
    
    return cleanup;
  }, [toast]);

  useEffect(() => {
    const cleanup = setupAutoSync(
      () => {
        setIsSyncing(true);
      },
      (result) => {
        setIsSyncing(false);
        
        if (result.success) {
          getSyncStatus().then(status => {
            setSyncStatus(status);
            refreshSessions();
          });
        } else {
          console.error('Sync failed:', result.message);
        }
      },
      300000
    );
    
    return cleanup;
  }, [toast]);
  
  const refreshSessions = async () => {
    const localSessions = await getLocalSessions();
    setSessions(localSessions);
  };
  
  const saveSession = async (session: Session): Promise<Session> => {
    const savedSession = await saveSessionLocally(session);
    await refreshSessions();
    return savedSession;
  };
  
  const getSessionById = async (id: string): Promise<Session | null> => {
    return await getLocalSessionById(id);
  };
  
  const updateSession = async (session: Session): Promise<Session> => {
    const updatedSession = await updateLocalSession(session);
    await refreshSessions();
    return updatedSession;
  };
  
  const saveInterview = async (interview: Interview): Promise<Interview> => {
    return await saveInterviewLocally(interview);
  };
  
  const getInterviews = async (): Promise<Interview[]> => {
    return await getLocalInterviews();
  };
  
  const getInterviewsForSession = async (sessionId: string): Promise<Interview[]> => {
    return await getLocalInterviewsForSession(sessionId);
  };
  
  const updateInterview = async (interview: Interview): Promise<Interview> => {
    return await updateLocalInterview(interview);
  };
  
  const syncNow = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    
    try {
      const result = await syncAll();
      
      if (result.success) {
        const status = await getSyncStatus();
        setSyncStatus(status);
        await refreshSessions();
        
        toast({
          title: "Sync Completed",
          description: `Last sync: ${new Date().toLocaleTimeString()}`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncStatus,
        sessions,
        saveSession,
        getSessionById,
        updateSession,
        saveInterview,
        getInterviews,
        getInterviewsForSession,
        updateInterview,
        saveInterviewer,
        getInterviewers,
        getInterviewerByCode,
        saveProject,
        getProjects,
        saveInterviewerProjects,
        getInterviewerProjects,
        syncNow,
        refreshSessions
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};
