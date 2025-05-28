
import { useState, useEffect } from "react";
import { Session, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSessionFilters } from "./useSessionFilters";
import { useSessionActions } from "./useSessionActions";
import { useDataFetching } from "./useDataFetching";
import { useFilter } from "@/contexts/FilterContext";
import { useToast } from "./use-toast";

export const useSessions = (
  interviewerId?: string,
  startDate?: string,
  endDate?: string
) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { interviewers, projects } = useDataFetching();
  const { selectedProject, selectedIsland } = useFilter();
  
  // Function to load sessions data
  const loadSessions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('sessions')
        .select('*');
        
      if (interviewerId) {
        query = query.eq('interviewer_id', interviewerId);
      }
      
      if (startDate) {
        query = query.gte('start_time', `${startDate}T00:00:00`);
      }
      
      if (endDate) {
        query = query.lte('start_time', `${endDate}T23:59:59`);
      }
      
      const { data, error } = await query.order('start_time', { ascending: false });
        
      if (error) throw error;
      
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Could not load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Set up real-time listener for sessions
  useEffect(() => {
    loadSessions();
    
    // Set up real-time listener for new sessions
    const channel = supabase
      .channel('public:sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setSessions(current => [payload.new as Session, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          setSessions(current => 
            current.map(session => 
              session.id === payload.new.id ? payload.new as Session : session
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setSessions(current => 
            current.filter(session => session.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewerId, startDate, endDate, toast]);
  
  // Function to manually refresh sessions
  const refreshSessions = async () => {
    await loadSessions();
  };
  
  // Initialize session filters
  const {
    filteredSessions: filterResults,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    applyFilters: applySessionFilters,
    resetFilters: resetSessionFilters
  } = useSessionFilters(sessions);
  
  // Initialize session actions
  // Fix: Pass setSessions as the state updater function instead of sessions array
  const { 
    stopSession, 
    updateSession, 
    deleteSession 
  } = useSessionActions(
    setSessions,
    setLoading,
    toast
  );
  
  // Helper function to get interviewer code from ID
  const getInterviewerCode = (interviewerId: string): string => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : "Unknown";
  };
  
  // Filter sessions based on global filters and session-specific filters
  const filteredSessions = filterResults.filter(session => {
    // Apply global project filter if set
    const matchesProject = !selectedProject || session.project_id === selectedProject.id;
    
    // Apply global island filter if set
    let matchesIsland = true;
    if (selectedIsland) {
      const sessionInterviewer = interviewers.find(i => i.id === session.interviewer_id);
      matchesIsland = sessionInterviewer?.island === selectedIsland;
    }
    
    // Apply interviewer code filter
    let matchesInterviewerCode = true;
    if (interviewerCodeFilter.trim()) {
      const interviewerCode = getInterviewerCode(session.interviewer_id);
      matchesInterviewerCode = interviewerCode.toLowerCase().includes(interviewerCodeFilter.toLowerCase());
    }
    
    return matchesProject && matchesIsland && matchesInterviewerCode;
  });
  
  // Apply filters function wrapper
  const applyFilters = () => {
    applySessionFilters(interviewers);
  };
  
  // Effect to auto-apply filters when interviewer code changes
  useEffect(() => {
    applyFilters();
  }, [interviewerCodeFilter, selectedProject, selectedIsland]);
  
  return { 
    sessions: filteredSessions,
    loading, 
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    getInterviewerCode,
    applyFilters,
    resetFilters: resetSessionFilters,
    stopSession,
    updateSession,
    deleteSession,
    refreshSessions
  };
};
