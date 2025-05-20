import { useState, useEffect, useRef, useCallback } from "react";
import { Session, Location, Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { 
  isOnline, 
  saveOfflineSession, 
  updateOfflineSession, 
  syncOfflineSessions,
  getInterviewsForOfflineSession,
  cacheInterviewer,
  getInterviewerByCode,
  cacheProjects
} from "@/lib/offlineDB";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  const validationInProgressRef = useRef(false);
  
  // State variables
  const [interviewerCode, setInterviewerCode] = useState<string>(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);
  const [offlineSessionId, setOfflineSessionId] = useState<number | null>(null);
  const [lastValidatedCode, setLastValidatedCode] = useState<string>("");

  // Load saved interviewer code from localStorage on initial render
  useEffect(() => {
    const loadSavedData = async () => {
      console.log("Loading saved data in useActiveSession");
      // First check if there's an active session in localStorage
      const savedSession = localStorage.getItem("active_session");
      const savedCode = localStorage.getItem("interviewerCode");
      
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          setActiveSession(sessionData);
          setIsRunning(true);
          setStartTime(sessionData.start_time);
          
          if (sessionData.start_latitude && sessionData.start_longitude) {
            setStartLocation({
              latitude: sessionData.start_latitude,
              longitude: sessionData.start_longitude,
              address: sessionData.start_address || undefined
            });
          }
          
          if (sessionData.offlineId) {
            setOfflineSessionId(sessionData.offlineId);
          }
        } catch (error) {
          console.error("Error parsing saved session:", error);
          // Clear invalid session data
          localStorage.removeItem("active_session");
        }
      }
      
      // If there's a saved interviewer code, use it and set as primary user
      if (savedCode) {
        console.log("Found saved interviewer code:", savedCode);
        setInterviewerCode(savedCode);
        setIsPrimaryUser(true); // Explicitly set as primary user when loading from localStorage
        setLastValidatedCode(savedCode);
        
        // Cache the interviewer for offline use
        await cacheInterviewer(savedCode, `Interviewer ${savedCode}`);
      }
    };
    
    loadSavedData();
  }, []); 

  // Effect for handling changes to interviewerCode and isPrimaryUser
  useEffect(() => {
    const saveInterviewerCode = async () => {
      if (interviewerCode && isPrimaryUser) {
        localStorage.setItem("interviewerCode", interviewerCode);
        
        // Cache the interviewer for offline use - pass the required arguments
        await cacheInterviewer(interviewerCode, `Interviewer ${interviewerCode}`);
        setLastValidatedCode(interviewerCode);
      } else if (!interviewerCode && isPrimaryUser) {
        // If code is cleared but user was primary, remove from storage
        localStorage.removeItem("interviewerCode");
      }
    };
    
    saveInterviewerCode();
  }, [interviewerCode, isPrimaryUser]);

  // Save active session to localStorage whenever it changes
  useEffect(() => {
    if (activeSession) {
      // Add offline session ID if available
      const sessionToSave = {
        ...activeSession,
        offlineId: offlineSessionId
      };
      localStorage.setItem("active_session", JSON.stringify(sessionToSave));
    } else {
      localStorage.removeItem("active_session");
    }
  }, [activeSession, offlineSessionId]);
  
  // Validate the interviewer code explicitly when requested (instead of on every change)
  const validateInterviewerCode = useCallback(async () => {
    // Prevent multiple simultaneous validations
    if (validationInProgressRef.current) {
      return false;
    }
    
    validationInProgressRef.current = true;
    
    if (!interviewerCode.trim()) {
      validationInProgressRef.current = false;
      return false;
    }
    
    try {
      setLoading(true);
      
      // Validate interviewer code (online or offline)
      const interviewer = await getInterviewerByCode(interviewerCode);
      
      if (!interviewer) {
        // If we've previously validated this code, don't show an error
        // This helps when going offline with a previously validated code
        if (interviewerCode !== lastValidatedCode) {
          toast({
            title: "Error",
            description: "Interviewer code not found",
            variant: "destructive",
          });
        }
        return false;
      }
      
      // Remember the last valid code and set as primary user
      setLastValidatedCode(interviewerCode);
      setIsPrimaryUser(true); // Explicitly set as primary user when code is valid
      console.log("Valid interviewer code found, setting isPrimaryUser to true");
      
      // Save valid code to localStorage
      localStorage.setItem("interviewerCode", interviewerCode);
      
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
      }
      return true;
    } catch (error) {
      console.error("Error checking active session:", error);
      toast({
        title: "Error",
        description: "Could not check active sessions",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
      validationInProgressRef.current = false;
    }
  }, [interviewerCode, lastValidatedCode, activeSession, toast]);

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
    
    // Store session data in localStorage for persistence
    localStorage.setItem("active_session", JSON.stringify(session));
  };

  // Helper function to reset session state
  const resetSessionState = () => {
    setActiveSession(null);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
    setOfflineSessionId(null);
    
    // Clear session data from localStorage
    localStorage.removeItem("active_session");
  };

  // Function to switch user
  const switchUser = () => {
    console.log("switchUser called - logging out");
    // Clear the interviewer code and session from localStorage
    localStorage.removeItem("interviewerCode");
    localStorage.removeItem("active_session");
    
    // Reset all state
    setInterviewerCode("");
    setIsPrimaryUser(false);
    resetSessionState();
    setLastValidatedCode("");
  };

  // Function to end session while preserving the primary user status
  const endSession = async () => {
    // If we have an offline session ID, update the offline session
    if (offlineSessionId !== null) {
      try {
        // Check if all interviews are completed (have results)
        const interviews = await getInterviewsForOfflineSession(offlineSessionId);
        const hasUnfinishedInterviews = interviews.some(i => i.result === null);
        
        if (hasUnfinishedInterviews) {
          toast({
            title: "Error",
            description: "Please complete all interviews before ending your session",
            variant: "destructive",
          });
          return;
        }
        
        await updateOfflineSession({
          id: offlineSessionId,
          endTime: new Date().toISOString(),
          location: undefined
        });
        
        // Try to sync if we're online
        if (isOnline()) {
          syncOfflineSessions().catch(err => {
            console.error("Error syncing sessions during session end:", err);
          });
        }
        
        // Reset session state
        resetSessionState();
      } catch (error) {
        console.error("Error ending offline session:", error);
        toast({
          title: "Error",
          description: "Could not end session",
          variant: "destructive",
        });
      }
      return;
    }
    
    resetSessionState();
    // We keep the interviewer code and primary user status
  };

  // Function to start a new session with improved performance
  const startSession = async (
    interviewerId: string,
    projectId: string | null,
    locationData?: Location
  ): Promise<Session | null> => {
    // If offline, save to local database
    if (!isOnline()) {
      try {
        const now = new Date().toISOString();
        const id = await saveOfflineSession(
          interviewerId,
          projectId,
          now,
          locationData
        );
        
        setOfflineSessionId(id);
        
        // Create a pseudo-session object to maintain compatibility
        const offlineSession: Session = {
          id: `offline-${id}`,
          interviewer_id: interviewerId,
          project_id: projectId,
          start_time: now,
          is_active: true,
          created_at: now
        };
        
        if (locationData) {
          offlineSession.start_latitude = locationData.latitude;
          offlineSession.start_longitude = locationData.longitude;
          offlineSession.start_address = locationData.address;
        }
        
        // Store the session in state and localStorage
        updateSessionState(offlineSession);
        
        toast({
          title: "Offline Mode",
          description: "Session started locally. It will sync when you're back online.",
        });
        
        return offlineSession;
      } catch (error) {
        console.error("Error starting offline session:", error);
        throw error;
      }
    }
    
    return null;
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
    startSession,
    offlineSessionId,
    lastValidatedCode,
    validateInterviewerCode
  };
};
