
import { useEffect, useCallback } from "react";
import { Session, Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { 
  isOnline,
  syncOfflineSessions,
  getInterviewerByCode,
} from "@/lib/offlineDB";
import { useInterviewerAuth } from "./session/useInterviewerAuth";
import { useSessionPersistence } from "./session/useSessionPersistence";
import { useOfflineSession } from "./session/useOfflineSession";
import { useSessionStateManager } from "./session/useSessionStateManager";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  
  // Use the new focused hooks
  const {
    interviewerCode,
    setInterviewerCode,
    isPrimaryUser,
    setIsPrimaryUser,
    lastValidatedCode,
    setLastValidatedCode,
    loading,
    validateInterviewerCode,
    switchUser: authSwitchUser
  } = useInterviewerAuth(initialInterviewerCode);

  const {
    activeSession,
    setActiveSession,
    isRunning,
    setIsRunning,
    startTime,
    setStartTime,
    startLocation,
    setStartLocation,
    offlineSessionId,
    setOfflineSessionId,
    updateSessionState,
    resetSessionState
  } = useSessionStateManager();

  const { startOfflineSession, endOfflineSession } = useOfflineSession({
    interviewerCode,
    offlineSessionId,
    setOfflineSessionId,
    updateSessionState,
    resetSessionState
  });

  // Handle loading saved data
  const handleLoadSavedData = useCallback((data: {
    session?: Session;
    code?: string;
    offlineId?: number;
  }) => {
    if (data.session) {
      updateSessionState(data.session);
      if (data.offlineId) {
        setOfflineSessionId(data.offlineId);
      }
    }
    
    if (data.code) {
      setInterviewerCode(data.code);
      setIsPrimaryUser(true);
      setLastValidatedCode(data.code);
    }
  }, [updateSessionState, setOfflineSessionId, setInterviewerCode, setIsPrimaryUser, setLastValidatedCode]);

  const { loadSavedData, clearStoredData } = useSessionPersistence({
    interviewerCode,
    isPrimaryUser,
    activeSession,
    offlineSessionId,
    onLoadSavedData: handleLoadSavedData
  });

  // Load saved data on initial render
  useEffect(() => {
    loadSavedData();
  }, []); 

  // Check online status changes
  useEffect(() => {
    const handleOnline = async () => {
      toast({
        title: "You are back online",
        description: "Syncing offline data...",
      });
      
      try {
        await syncOfflineSessions();
      } catch (error) {
        console.error("Error syncing sessions on reconnect:", error);
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  // Enhanced validate function that also checks for active sessions
  const enhancedValidateInterviewerCode = useCallback(async () => {
    const isValid = await validateInterviewerCode();
    
    if (!isValid) {
      return false;
    }

    // Attempt to sync offline sessions when checking for active sessions
    if (isOnline()) {
      syncOfflineSessions().catch(err => {
        console.error("Error syncing sessions during validation:", err);
      });
    }
    
    // Don't fetch online sessions if we already have an active session in localStorage
    if (activeSession) {
      return true;
    }
    
    // Only check online sessions if we're online
    if (isOnline()) {
      try {
        // Get the interviewer by code
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) {
          throw interviewerError;
        }
        
        if (!interviewers || interviewers.length === 0) {
          return false;
        }
        
        const interviewerId = interviewers[0].id;
        
        // Check for active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .eq('is_active', true)
          .limit(1);
          
        if (sessionError) {
          throw sessionError;
        }
        
        if (sessions && sessions.length > 0) {
          console.log("Found active session:", sessions[0]);
          updateSessionState(sessions[0]);
        }
      } catch (error) {
        console.error("Error checking active session:", error);
        toast({
          title: "Error",
          description: "Could not check active sessions",
          variant: "destructive",
        });
      }
    }
    
    return true;
  }, [validateInterviewerCode, activeSession, interviewerCode, updateSessionState, toast]);

  // Function to switch user
  const switchUser = useCallback(() => {
    clearStoredData();
    authSwitchUser();
    resetSessionState();
  }, [clearStoredData, authSwitchUser, resetSessionState]);

  // Function to end session
  const endSession = useCallback(async () => {
    // Try ending offline session first
    const offlineEnded = await endOfflineSession();
    if (offlineEnded) {
      // Try to sync if we're online
      if (isOnline()) {
        syncOfflineSessions().catch(err => {
          console.error("Error syncing during session end:", err);
        });
      }
      return;
    }
    
    // If not an offline session, just reset state
    resetSessionState();
  }, [endOfflineSession, resetSessionState]);

  // Function to start a new session
  const startSession = useCallback(async (
    interviewerId: string,
    projectId: string | null,
    locationData?: Location
  ): Promise<Session | null> => {
    // Try offline session first
    const offlineSession = await startOfflineSession(interviewerId, projectId, locationData);
    if (offlineSession) {
      return offlineSession;
    }
    
    return null;
  }, [startOfflineSession]);

  return {
    interviewerCode,
    setInterviewerCode,
    isRunning,
    setIsRunning,
    startTime,
    setStartTime,
    startLocation,
    setStartLocation,
    activeSession,
    setActiveSession,
    loading,
    isPrimaryUser,
    setIsPrimaryUser,
    switchUser,
    endSession,
    startSession,
    offlineSessionId,
    lastValidatedCode,
    validateInterviewerCode: enhancedValidateInterviewerCode
  };
};
