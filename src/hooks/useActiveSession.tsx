import { useState, useEffect } from "react";
import { Session, Location, Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useOffline } from "@/contexts/OfflineContext";
import { v4 as uuidv4 } from "uuid";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  const { 
    isOnline, 
    saveSession, 
    getSessionById, 
    updateSession, 
    sessions: localSessions,
    saveInterviewer,
    getInterviewers
  } = useOffline();
  
  // State variables
  const [interviewerCode, setInterviewerCode] = useState(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);
  const [localInterviewers, setLocalInterviewers] = useState<any[]>([]);

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
    loadLocalInterviewers();
  }, [interviewerCode]);

  // Load interviewers from local storage
  const loadLocalInterviewers = async () => {
    try {
      const interviewers = await getInterviewers();
      setLocalInterviewers(interviewers);
    } catch (error) {
      console.error("Error loading local interviewers:", error);
    }
  };

  // Save interviewer code to localStorage when it changes
  useEffect(() => {
    const saveInterviewerCode = () => {
      if (interviewerCode && isPrimaryUser) {
        localStorage.setItem("interviewerCode", interviewerCode);
      }
    };
    
    saveInterviewerCode();
  }, [interviewerCode, isPrimaryUser]);

  // Check if there's an active session for this interviewer
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim()) {
        return;
      }
      
      try {
        setLoading(true);
        
        // First check local sessions by exact match for interviewer code
        let activeLocalSession = localSessions.find(
          s => s.is_active === true && s.interviewer_id === interviewerCode
        );
        
        // If not found by exact match, try to get ID and then check again
        if (!activeLocalSession) {
          const interviewerId = await getInterviewerIdFromCode(interviewerCode);
          
          if (interviewerId) {
            activeLocalSession = localSessions.find(
              s => s.is_active === true && s.interviewer_id === interviewerId
            );
          }
        }
        
        if (activeLocalSession) {
          console.log("Found active local session:", activeLocalSession);
          updateSessionState(activeLocalSession);
          return;
        }
        
        // Only check Supabase if online
        if (isOnline) {
          // Get the interviewer by code
          const interviewerId = await getInterviewerIdFromCode(interviewerCode, true);
          
          if (!interviewerId) {
            return;
          }
          
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
            console.log("Found active session from server:", sessions[0]);
            
            // Save to local storage
            const savedSession = await saveSession({
              ...sessions[0],
              sync_status: 'synced'
            });
            
            updateSessionState(savedSession);
          } else {
            resetSessionState();
          }
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
  }, [interviewerCode, isOnline, localSessions, saveSession, toast]);

  // Helper function to get interviewer ID from code
  const getInterviewerIdFromCode = async (code: string, fetchFromServer: boolean = false): Promise<string | null> => {
    try {
      // Try to find interviewer in local storage first
      const localInterviewer = localInterviewers.find(i => i.code === code);
      
      if (localInterviewer) {
        return localInterviewer.id;
      }
      
      // If not found locally and we're online, check Supabase
      if (isOnline && fetchFromServer) {
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('*') // Get all interviewer data for offline use
          .eq('code', code)
          .limit(1);
            
        if (interviewerError) {
          throw interviewerError;
        }
          
        if (!interviewers || interviewers.length === 0) {
          return null;
        }
          
        // Save interviewer locally for offline use
        if (interviewers[0]) {
          await saveInterviewer(interviewers[0]);
          
          // Refresh local interviewers
          await loadLocalInterviewers();
        }
          
        return interviewers[0].id;
      }
      
      // If we're offline and interviewer not found in local storage,
      // we'll use the code as the ID for now and sync later
      if (!isOnline) {
        return code;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting interviewer ID:", error);
      return null;
    }
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
  };

  // Function to switch user
  const switchUser = () => {
    // Clear the interviewer code from localStorage
    localStorage.removeItem("interviewerCode");
    
    // Reset all state
    setInterviewerCode("");
    setIsPrimaryUser(false);
    resetSessionState();
  };

  // Function to end session while preserving the primary user status
  const endSession = () => {
    resetSessionState();
    // We keep the interviewer code and primary user status
  };

  // Verify interviewer code exists
  const verifyInterviewerCode = async (code: string): Promise<boolean> => {
    // First check local storage
    const localInterviewer = localInterviewers.find(i => i.code === code);
    if (localInterviewer) {
      return true;
    }
    
    // If online, check server
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .eq('code', code)
          .limit(1);
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Save interviewer locally for offline use
          await saveInterviewer(data[0]);
          await loadLocalInterviewers();
          return true;
        }
      } catch (error) {
        console.error("Error verifying interviewer code:", error);
      }
    }
    
    return false;
  }

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
    verifyInterviewerCode
  };
};
