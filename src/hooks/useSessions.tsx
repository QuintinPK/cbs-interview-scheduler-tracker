
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSessionFilters } from "@/hooks/useSessionFilters";
import { useSessionActions } from "@/hooks/useSessionActions";
import { getCurrentLocation } from "@/lib/utils";

export const useSessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { 
    filteredSessions,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    applyFilters,
    resetFilters
  } = useSessionFilters(sessions);
  
  const {
    stopSession,
    updateSession,
    deleteSession
  } = useSessionActions(sessions, setSessions, filteredSessions, setLoading, toast);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load interviewers first
      const { data: interviewersData, error: interviewersError } = await supabase
        .from('interviewers')
        .select('*');
        
      if (interviewersError) throw interviewersError;
      setInterviewers(interviewersData || []);
      
      // Then load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });
        
      if (sessionsError) throw sessionsError;
      
      const transformedSessions = sessionsData.map(session => ({
        ...session,
        start_latitude: session.start_latitude !== null ? Number(session.start_latitude) : null,
        start_longitude: session.start_longitude !== null ? Number(session.start_longitude) : null,
        end_latitude: session.end_latitude !== null ? Number(session.end_latitude) : null,
        end_longitude: session.end_longitude !== null ? Number(session.end_longitude) : null,
      }));
      
      setSessions(transformedSessions);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Could not load sessions data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [toast]);
  
  const getInterviewerCode = (interviewerId: string) => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : 'Unknown';
  };

  return {
    sessions,
    filteredSessions,
    interviewers,
    loading,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    getInterviewerCode,
    applyFilters,
    resetFilters,
    stopSession,
    updateSession,
    deleteSession,
    refresh: loadData
  };
};
