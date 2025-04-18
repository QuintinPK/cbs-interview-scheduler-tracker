
import { useState, useEffect } from "react";
import { Session, Location, Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  
  // State variables
  const [interviewerCode, setInterviewerCode] = useState(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);

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

  // Check if there's an active session for this interviewer on code change
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim()) {
        return;
      }
      
      try {
        setLoading(true);
        
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
          return;
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
        } else {
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
  }, [interviewerCode, toast]);

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
    endSession
  };
};
