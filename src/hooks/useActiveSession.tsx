import { useState, useEffect } from "react";
import { Session, Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useConnectionStatus } from "./useConnectionStatus";
import { 
  saveActiveOfflineSession, 
  getActiveOfflineSession, 
  clearActiveOfflineSession,
  savePendingSession,
  getPendingSessions,
  STORAGE_KEYS,
  getFromStorage,
  saveToStorage,
  removeFromStorage
} from "@/lib/offlineStorage";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  const { isOnline } = useConnectionStatus();
  
  // State variables
  const [interviewerCode, setInterviewerCode] = useState(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const [interviewerId, setInterviewerId] = useState<string | null>(null);

  // Load saved interviewer code from localStorage on initial render
  useEffect(() => {
    const loadSavedInterviewerCode = () => {
      const savedCode = localStorage.getItem("interviewerCode");
      if (savedCode && !interviewerCode) {
        setInterviewerCode(savedCode);
        setIsPrimaryUser(true);
      }
    };
    
    loadSavedInterviewerCode();
  }, [interviewerCode]);

  // Save interviewer code to localStorage when it changes
  useEffect(() => {
    const saveInterviewerCode = () => {
      if (interviewerCode && isPrimaryUser) {
        localStorage.setItem("interviewerCode", interviewerCode);
      }
    };
    
    saveInterviewerCode();
  }, [interviewerCode, isPrimaryUser]);

  // Load offline session if exists
  useEffect(() => {
    const checkOfflineSession = () => {
      const offlineSession = getActiveOfflineSession();
      if (offlineSession && interviewerCode) {
        setIsOfflineSession(true);
        setIsRunning(true);
        setStartTime(offlineSession.start_time as string);
        
        if (offlineSession.start_latitude && offlineSession.start_longitude) {
          setStartLocation({
            latitude: offlineSession.start_latitude as number,
            longitude: offlineSession.start_longitude as number,
            address: offlineSession.start_address || undefined
          });
        }
        
        // Create a Session-like object from the offline data
        const sessionData = {
          ...offlineSession,
          id: "offline", // Temporary ID
          is_active: true
        } as Session;
        
        setActiveSession(sessionData);
      }
    };
    
    checkOfflineSession();
  }, [interviewerCode]);

  // Check if there's an active session for this interviewer on code change or when coming online
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim() || !isOnline) return;
      
      try {
        setLoading(true);
        
        // Get the interviewer by code
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) throw interviewerError;
        if (!interviewers || interviewers.length === 0) return;
        
        const interviewerId = interviewers[0].id;
        setInterviewerId(interviewerId);
        
        // Check for active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .eq('is_active', true)
          .limit(1);
          
        if (sessionError) throw sessionError;
        
        // If we have an offline session and online session, handle the conflict
        if (isOfflineSession && sessions && sessions.length > 0) {
          handleSessionConflict(sessions[0]);
        } 
        // If we have an online session but no offline session
        else if (sessions && sessions.length > 0) {
          updateSessionState(sessions[0]);
          setIsOfflineSession(false);
        }
        // If we have an offline session but no online session
        else if (isOfflineSession) {
          // Keep the offline session state, it will be synced when ended
        }
        // No session active
        else {
          resetSessionState();
        }
      } catch (error) {
        console.error("Error checking active session:", error);
        toast({
          title: "Error",
          description: "Could not check active sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkActiveSession();
  }, [interviewerCode, isOnline, toast, isOfflineSession]);

  // Handle conflict between offline and online sessions
  const handleSessionConflict = (onlineSession: Session) => {
    // For now, we'll prioritize the online session
    toast({
      title: "Session Conflict",
      description: "Found an active online session. Using that instead of your offline session.",
    });

    // Clear the offline session
    clearActiveOfflineSession();
    setIsOfflineSession(false);

    // Use the online session
    updateSessionState(onlineSession);
  };

  // Helper function to update session state
  const updateSessionState = (session: Session) => {
    setActiveSession(session);
    setIsRunning(true);
    setStartTime(session.start_time);
    
    if (session.start_latitude && session.start_longitude) {
      setStartLocation({
        latitude: session.start_latitude,
        longitude: session.start_longitude,
        address: session.start_address || undefined
      });
    }
  };

  // Helper function to reset session state
  const resetSessionState = () => {
    setActiveSession(null);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
    setIsOfflineSession(false);
    clearActiveOfflineSession();
  };

  // Function to switch user
  const switchUser = () => {
    // Clear the interviewer code from localStorage
    localStorage.removeItem("interviewerCode");
    
    // Reset all state
    setInterviewerCode("");
    setIsPrimaryUser(false);
    resetSessionState();
    setInterviewerId(null);
  };

  // Function to end session while preserving the primary user status
  const endSession = () => {
    resetSessionState();
    // We keep the interviewer code and primary user status
  };

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
    isOfflineSession,
    setIsOfflineSession,
    interviewerId,
    isOnline
  };
};
