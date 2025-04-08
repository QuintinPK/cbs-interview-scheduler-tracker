
import { useState, useEffect } from "react";
import { Session, Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useActiveSession = (initialInterviewerCode: string = "") => {
  const { toast } = useToast();
  const [interviewerCode, setInterviewerCode] = useState(initialInterviewerCode);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<Location | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrimaryUser, setIsPrimaryUser] = useState(false);

  // Load saved interviewer code from localStorage on initial render
  useEffect(() => {
    const savedCode = localStorage.getItem("interviewerCode");
    if (savedCode && !interviewerCode) {
      setInterviewerCode(savedCode);
      setIsPrimaryUser(true);
    }
  }, [interviewerCode]);

  // Save interviewer code to localStorage when it changes
  useEffect(() => {
    if (interviewerCode) {
      localStorage.setItem("interviewerCode", interviewerCode);
    }
  }, [interviewerCode]);

  // Check if there's an active session for this interviewer on code change
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!interviewerCode.trim()) return;
      
      try {
        setLoading(true);
        
        // First get the interviewer by code
        const { data: interviewers, error: interviewerError } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .limit(1);
          
        if (interviewerError) throw interviewerError;
        if (!interviewers || interviewers.length === 0) return;
        
        const interviewerId = interviewers[0].id;
        
        // Then check for active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .eq('is_active', true)
          .limit(1);
          
        if (sessionError) throw sessionError;
        
        if (sessions && sessions.length > 0) {
          setActiveSession(sessions[0]);
          setIsRunning(true);
          setStartTime(sessions[0].start_time);
          
          if (sessions[0].start_latitude && sessions[0].start_longitude) {
            setStartLocation({
              latitude: sessions[0].start_latitude,
              longitude: sessions[0].start_longitude,
              address: sessions[0].start_address || undefined
            });
          }
        } else {
          setActiveSession(null);
          setIsRunning(false);
          setStartTime(null);
          setStartLocation(undefined);
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

  const switchUser = () => {
    // Clear the interviewer code from localStorage
    localStorage.removeItem("interviewerCode");
    
    // Reset all state
    setInterviewerCode("");
    setIsPrimaryUser(false);
    setIsRunning(false);
    setStartTime(null);
    setStartLocation(undefined);
    setActiveSession(null);
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
    switchUser
  };
};
