
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, Interview } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  saveSessionLocally,
  getLocalSessions,
  getLocalSessionById,
  updateLocalSession,
  removeLocalSession,
  saveInterviewLocally,
  getLocalInterviews,
  getLocalInterviewsForSession,
  updateLocalInterview,
  removeLocalInterview,
  syncAll,
  setupConnectivityListeners,
  setupAutoSync,
  getSyncStatus,
  updateSyncStatus,
  SyncStatus,
  initSyncStatus
} from '@/services/offlineStorage';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  unsyncedCount: number;
  sessions: Session[];
  interviews: Interview[];
  
  // Session operations
  saveSession: (session: Session) => Promise<Session>;
  getSessionById: (id: string) => Promise<Session | null>;
  updateSession: (session: Session) => Promise<Session>;
  removeSession: (id: string) => Promise<void>;
  
  // Interview operations
  saveInterview: (interview: Interview) => Promise<Interview>;
  getInterviews: () => Promise<Interview[]>;
  getInterviewsForSession: (sessionId: string) => Promise<Interview[]>;
  updateInterview: (interview: Interview) => Promise<Interview>;
  removeInterview: (id: string) => Promise<void>;
  
  // Sync operations
  syncNow: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  
  // Initialize and load data
  useEffect(() => {
    const initialize = async () => {
      // Initialize sync status
      const status = await initSyncStatus();
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setLastSyncTime(status.lastSuccessfulSync);
      
      // Load initial data
      await refreshData();
    };
    
    initialize();
  }, []);
  
  // Set up connectivity listeners
  useEffect(() => {
    const cleanup = setupConnectivityListeners(
      // Online callback
      () => {
        setIsOnline(true);
        toast({
          title: "You're back online!",
          description: "Your data will be synced automatically.",
        });
      },
      // Offline callback
      () => {
        setIsOnline(false);
        toast({
          title: "You're offline",
          description: "Your changes will be saved locally and synced when you're back online.",
          variant: "destructive",
        });
      }
    );
    
    return cleanup;
  }, [toast]);
  
  // Set up auto-sync
  useEffect(() => {
    const cleanup = setupAutoSync(
      // Sync start callback
      () => {
        setIsSyncing(true);
      },
      // Sync complete callback
      (result) => {
        setIsSyncing(false);
        if (result.success) {
          setLastSyncTime(new Date().toISOString());
          refreshData();
        }
      },
      5 * 60 * 1000 // Sync every 5 minutes
    );
    
    return cleanup;
  }, []);
  
  // Update unsynced count when data changes
  useEffect(() => {
    const countUnsynced = async () => {
      const unsyncedSessions = sessions.filter(s => s.sync_status === 'unsynced').length;
      const unsyncedInterviews = interviews.filter(i => i.sync_status === 'unsynced').length;
      setUnsyncedCount(unsyncedSessions + unsyncedInterviews);
    };
    
    countUnsynced();
  }, [sessions, interviews]);
  
  // Load data from local storage
  const refreshData = async () => {
    const localSessions = await getLocalSessions();
    setSessions(localSessions);
    
    const localInterviews = await getLocalInterviews();
    setInterviews(localInterviews);
    
    const status = await getSyncStatus();
    setIsOnline(status.isOnline);
    setIsSyncing(status.isSyncing);
    setLastSyncTime(status.lastSuccessfulSync);
  };
  
  // Session operations
  const saveSession = async (session: Session): Promise<Session> => {
    const savedSession = await saveSessionLocally(session);
    await refreshData();
    return savedSession;
  };
  
  const getSessionById = async (id: string): Promise<Session | null> => {
    return await getLocalSessionById(id);
  };
  
  const updateSession = async (session: Session): Promise<Session> => {
    const updatedSession = await updateLocalSession(session);
    await refreshData();
    return updatedSession;
  };
  
  const removeSession = async (id: string): Promise<void> => {
    // Check if session is unsynced
    const session = await getSessionById(id);
    if (session && session.sync_status === 'unsynced') {
      throw new Error('Cannot delete unsynced session');
    }
    
    await removeLocalSession(id);
    await refreshData();
  };
  
  // Interview operations
  const saveInterview = async (interview: Interview): Promise<Interview> => {
    const savedInterview = await saveInterviewLocally(interview);
    await refreshData();
    return savedInterview;
  };
  
  const getInterviews = async (): Promise<Interview[]> => {
    return await getLocalInterviews();
  };
  
  const getInterviewsForSession = async (sessionId: string): Promise<Interview[]> => {
    return await getLocalInterviewsForSession(sessionId);
  };
  
  const updateInterview = async (interview: Interview): Promise<Interview> => {
    const updatedInterview = await updateLocalInterview(interview);
    await refreshData();
    return updatedInterview;
  };
  
  const removeInterview = async (id: string): Promise<void> => {
    // Check if interview is unsynced
    const allInterviews = await getLocalInterviews();
    const interview = allInterviews.find(i => i.local_id === id || i.id === id);
    
    if (interview && interview.sync_status === 'unsynced') {
      throw new Error('Cannot delete unsynced interview');
    }
    
    const localId = interview?.local_id || id;
    await removeLocalInterview(localId);
    await refreshData();
  };
  
  // Sync operations
  const syncNow = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    const result = await syncAll();
    setIsSyncing(false);
    
    if (result.success) {
      setLastSyncTime(new Date().toISOString());
      toast({
        title: "Sync complete",
        description: "All your data has been synced successfully.",
      });
      refreshData();
    } else {
      toast({
        title: "Sync failed",
        description: result.message,
        variant: "destructive",
      });
    }
    
    return result;
  };
  
  const value = {
    isOnline,
    isSyncing,
    lastSyncTime,
    unsyncedCount,
    sessions,
    interviews,
    saveSession,
    getSessionById,
    updateSession,
    removeSession,
    saveInterview,
    getInterviews,
    getInterviewsForSession,
    updateInterview,
    removeInterview,
    syncNow,
    refreshData,
  };
  
  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
