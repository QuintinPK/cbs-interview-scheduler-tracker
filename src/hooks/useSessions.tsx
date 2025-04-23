
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
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const { interviewers } = useDataFetching();
  
  // Load sessions directly from Supabase when date range is provided
  useEffect(() => {
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
        
        const { data, error } = await query.order('start_time');
          
        if (error) throw error;
        
        setSessions(data || []);
        setFilteredSessions(data || []);
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
    
    loadSessions();
  }, [interviewerId, startDate, endDate, toast]);
  
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
  const { 
    stopSession, 
    updateSession, 
    deleteSession 
  } = useSessionActions(
    sessions, 
    setSessions,
    filteredSessions,
    setLoading,
    toast
  );
  
  // Helper function to get interviewer code from ID
  const getInterviewerCode = (interviewerId: string): string => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : "Unknown";
  };
  
  // Wrapper for applying filters
  const applyFilters = () => {
    applySessionFilters(interviewers);
  };
  
  return { 
    sessions: filteredSessions,
    filteredSessions,
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
    deleteSession
  };
};
