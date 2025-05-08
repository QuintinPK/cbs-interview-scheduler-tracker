
import { useState, useEffect } from "react";
import { Session, Location, Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { 
  isOnline, 
  saveOfflineSession, 
  updateOfflineSession, 
  syncOfflineSessions,
  getInterviewsForOfflineSession
} from "@/lib/offlineDB";

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
  const [offlineSessionId, setOfflineSessionId] = useState<number | null>(null);

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
        
        // Attempt to sync offline sessions when checking for active sessions
        if (isOnline()) {
          await syncOfflineSessions();
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

  // Check online status changes
  useEffect(() => {
    const handleOnline = async () => {
      toast({
        title: "You are back online",
        description: "Syncing offline sessions...",
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
  };

  // Helper function to reset session state
  const resetSessionState = () => {
    setActiveSession(null);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
    setOfflineSessionId(null);
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
        
        await updateOfflineSession(
          offlineSessionId,
          new Date().toISOString(),
          // Include end location if available
          undefined
        );
        
        // Try to sync if we're online
        if (isOnline()) {
          await syncOfflineSessions();
        }
      } catch (error) {
        console.error("Error ending offline session:", error);
      }
    }
    
    resetSessionState();
    // We keep the interviewer code and primary user status
  };

  // Function to start a new session
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
          interviewerCode,
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
    offlineSessionId
  };
};
