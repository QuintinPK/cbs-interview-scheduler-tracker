import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session, Location } from '@/types';
import { getCurrentLocation } from '@/lib/utils';
import { 
  saveOfflineSession, 
  updateOfflineSession, 
  isOnline, 
  syncOfflineSessions,
  getSyncStatus,
  acquireSyncLock,
  releaseSyncLock
} from '@/lib/offlineDB';

interface EnhancedSessionState {
  activeSession: Session | null;
  offlineSessionId: number | null;
  isLoading: boolean;
  syncStatus: {
    sessionsUnsynced: number;
    interviewsUnsynced: number;
    lastSync: string;
    currentLock: any;
    sessionsTotal: number;
    sessionsInProgress: number;
    interviewsTotal: number;
    interviewsInProgress: number;
  } | null;
}

export const useEnhancedSession = () => {
  const [state, setState] = useState<EnhancedSessionState>({
    activeSession: null,
    offlineSessionId: null,
    isLoading: false,
    syncStatus: null,
  });
  
  const { toast } = useToast();
  const operationInProgressRef = useRef(false);

  // Load saved session and sync status on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        // Load saved session from localStorage
        const savedSession = localStorage.getItem('activeSession');
        const savedOfflineId = localStorage.getItem('offlineSessionId');
        
        if (savedSession) {
          setState(prev => ({
            ...prev,
            activeSession: JSON.parse(savedSession),
            offlineSessionId: savedOfflineId ? parseInt(savedOfflineId) : null,
          }));
        }

        // Load sync status
        const syncStatus = await getSyncStatus();
        setState(prev => ({ ...prev, syncStatus }));
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    };

    loadSessionData();
    
    // Set up periodic sync status updates
    const interval = setInterval(async () => {
      try {
        const syncStatus = await getSyncStatus();
        setState(prev => ({ ...prev, syncStatus }));
      } catch (error) {
        console.error('Error updating sync status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      try {
        await syncOfflineSessions();
        const syncStatus = await getSyncStatus();
        setState(prev => ({ ...prev, syncStatus }));
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const startSession = useCallback(async (interviewerId: string, projectId?: string): Promise<boolean> => {
    if (operationInProgressRef.current) return false;
    operationInProgressRef.current = true;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const now = new Date().toISOString();
      const currentLocation = await getCurrentLocation();

      if (!isOnline()) {
        // Handle offline session creation
        const offlineId = await saveOfflineSession(
          interviewerId,
          projectId || null,
          now,
          currentLocation
        );

        const offlineSession: Session = {
          id: `offline-${offlineId}`,
          interviewer_id: interviewerId,
          project_id: projectId || '',
          start_time: now,
          is_active: true,
          start_latitude: currentLocation?.latitude,
          start_longitude: currentLocation?.longitude,
          start_address: currentLocation?.address,
        };

        setState(prev => ({
          ...prev,
          activeSession: offlineSession,
          offlineSessionId: offlineId,
        }));

        localStorage.setItem('activeSession', JSON.stringify(offlineSession));
        localStorage.setItem('offlineSessionId', offlineId.toString());

        toast({
          title: "Session Started",
          description: "Session saved locally. Will sync when online.",
        });

        return true;
      }

      // Handle online session creation
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          interviewer_id: interviewerId,
          project_id: projectId,
          start_latitude: currentLocation?.latitude || null,
          start_longitude: currentLocation?.longitude || null,
          start_address: currentLocation?.address || null,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      const session: Session = data;
      setState(prev => ({ 
        ...prev, 
        activeSession: session,
        offlineSessionId: null,
      }));

      localStorage.setItem('activeSession', JSON.stringify(session));
      localStorage.removeItem('offlineSessionId');

      toast({
        title: "Session Started",
        description: "Session created successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Could not start session",
        variant: "destructive",
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      operationInProgressRef.current = false;
    }
  }, [toast]);

  const endSession = useCallback(async (): Promise<boolean> => {
    if (operationInProgressRef.current || !state.activeSession) return false;
    operationInProgressRef.current = true;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const now = new Date().toISOString();
      const currentLocation = await getCurrentLocation();

      if (state.offlineSessionId !== null) {
        // Handle offline session ending
        await updateOfflineSession(
          state.offlineSessionId,
          now,
          currentLocation
        );

        // Trigger sync if online
        if (isOnline()) {
          setTimeout(async () => {
            try {
              await syncOfflineSessions();
              const syncStatus = await getSyncStatus();
              setState(prev => ({ ...prev, syncStatus }));
            } catch (error) {
              console.error('Sync after session end failed:', error);
            }
          }, 1000);
        }

        toast({
          title: "Session Ended",
          description: isOnline() ? "Session ended and syncing..." : "Session ended. Will sync when online.",
        });
      } else {
        // Handle online session ending
        const { error } = await supabase
          .from('sessions')
          .update({
            end_time: now,
            is_active: false,
            end_latitude: currentLocation?.latitude || null,
            end_longitude: currentLocation?.longitude || null,
            end_address: currentLocation?.address || null,
          })
          .eq('id', state.activeSession.id);

        if (error) throw error;

        toast({
          title: "Session Ended",
          description: "Session completed successfully.",
        });
      }

      // Clear session state
      setState(prev => ({ 
        ...prev, 
        activeSession: null,
        offlineSessionId: null,
      }));
      
      localStorage.removeItem('activeSession');
      localStorage.removeItem('offlineSessionId');

      return true;
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Could not end session properly. Session marked as ended locally.",
        variant: "destructive",
      });

      // Even if sync fails, mark session as ended locally
      setState(prev => ({ 
        ...prev, 
        activeSession: null,
        offlineSessionId: null,
      }));
      
      localStorage.removeItem('activeSession');
      localStorage.removeItem('offlineSessionId');

      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      operationInProgressRef.current = false;
    }
  }, [state.activeSession, state.offlineSessionId, toast]);

  const forceSyncNow = useCallback(async (): Promise<boolean> => {
    if (!isOnline()) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive",
      });
      return false;
    }

    try {
      await syncOfflineSessions();
      const syncStatus = await getSyncStatus();
      setState(prev => ({ ...prev, syncStatus }));
      
      toast({
        title: "Sync Complete",
        description: "All data synchronized successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast({
        title: "Sync Failed", 
        description: "Could not sync data. Will retry automatically.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    // State
    activeSession: state.activeSession,
    offlineSessionId: state.offlineSessionId,
    isLoading: state.isLoading,
    syncStatus: state.syncStatus,
    
    // Actions
    startSession,
    endSession,
    forceSyncNow,
    
    // Computed
    hasActiveSession: state.activeSession !== null,
    isOfflineSession: state.offlineSessionId !== null,
    hasUnsyncedData: (state.syncStatus?.sessionsUnsynced || 0) + (state.syncStatus?.interviewsUnsynced || 0) > 0,
  };
};