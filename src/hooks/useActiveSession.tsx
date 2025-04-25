
import { useState, useEffect } from "react";
import { Session, Location, Project, Interviewer } from "@/types";
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
  
  const [interviewerCode, setInterviewerCode] = useState(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);
  const [localInterviewers, setLocalInterviewers] = useState<Interviewer[]>([]);

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

  const loadLocalInterviewers = async () => {
    try {
      const interviewers = await getInterviewers();
      setLocalInterviewers(interviewers);
    } catch (error) {
      console.error("Error loading local interviewers:", error);
    }
  };

  useEffect(() => {
    const saveInterviewerCode = () => {
      if (interviewerCode && isPrimaryUser) {
        localStorage.setItem("interviewerCode", interviewerCode);
      }
    };
    
    saveInterviewerCode();
  }, [interviewerCode, isPrimaryUser]);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim()) {
        return;
      }
      
      try {
        setLoading(true);
        
        let activeLocalSession = localSessions.find(
          s => s.is_active === true && s.interviewer_id === interviewerCode
        );
        
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
        
        if (isOnline) {
          const interviewerId = await getInterviewerIdFromCode(interviewerCode, true);
          
          if (!interviewerId) {
            return;
          }
          
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

  const getInterviewerIdFromCode = async (code: string, fetchFromServer: boolean = false): Promise<string | null> => {
    try {
      const localInterviewer = localInterviewers.find(i => i.code === code);
      
      if (localInterviewer) {
        return localInterviewer.id;
      }
      
      if (isOnline && fetchFromServer) {
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('*')
          .eq('code', code)
          .limit(1);
            
        if (interviewerError) {
          throw interviewerError;
        }
          
        if (!interviewers || interviewers.length === 0) {
          return null;
        }
          
        const interviewer = interviewers[0];
        const typedInterviewer: Interviewer = {
          id: interviewer.id,
          code: interviewer.code,
          first_name: interviewer.first_name,
          last_name: interviewer.last_name,
          phone: interviewer.phone || "",
          email: interviewer.email || "",
          // Cast the island to the correct union type or undefined if it doesn't match
          island: (interviewer.island as "Bonaire" | "Saba" | "Sint Eustatius" | undefined)
        };
        
        await saveInterviewer(typedInterviewer);
        
        await loadLocalInterviewers();
        return interviewer.id;
      }
      
      if (!isOnline) {
        return code;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting interviewer ID:", error);
      return null;
    }
  };

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

  const resetSessionState = () => {
    setActiveSession(null);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
  };

  const switchUser = () => {
    localStorage.removeItem("interviewerCode");
    setInterviewerCode("");
    setIsPrimaryUser(false);
    resetSessionState();
  };

  const endSession = () => {
    resetSessionState();
  };

  const verifyInterviewerCode = async (code: string): Promise<boolean> => {
    const localInterviewer = localInterviewers.find(i => i.code === code);
    if (localInterviewer) {
      return true;
    }
    
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
          const interviewer = data[0];
          const typedInterviewer: Interviewer = {
            id: interviewer.id,
            code: interviewer.code,
            first_name: interviewer.first_name,
            last_name: interviewer.last_name,
            phone: interviewer.phone || "",
            email: interviewer.email || "",
            // Cast the island to the correct union type or undefined if it doesn't match
            island: (interviewer.island as "Bonaire" | "Saba" | "Sint Eustatius" | undefined)
          };
          await saveInterviewer(typedInterviewer);
          await loadLocalInterviewers();
          return true;
        }
      } catch (error) {
        console.error("Error verifying interviewer code:", error);
      }
    }
    
    return false;
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
    verifyInterviewerCode
  };
};
