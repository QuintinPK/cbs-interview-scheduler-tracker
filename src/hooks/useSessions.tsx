
import { useState, useEffect } from "react";
import { Session, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSessionFilters } from "./useSessionFilters";
import { useSessionActions } from "./useSessionActions";
import { useDataFetching } from "./useDataFetching";
import { useToast } from "./use-toast";

export const useSessions = (
  interviewerId?: string,
  startDate?: string,
  endDate?: string
) => {
  const { toast } = useToast();
  const { sessions: allSessions, interviewers, loading: fetchLoading } = useDataFetching();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  
  // Initialize with sessions specific to the interviewer if ID is provided
  useEffect(() => {
    if (interviewerId) {
      const interviewerSessions = allSessions.filter(
        session => session.interviewer_id === interviewerId
      );
      setSessions(interviewerSessions);
      setFilteredSessions(interviewerSessions);
    } else {
      setSessions(allSessions);
      setFilteredSessions(allSessions);
    }
    setLoading(fetchLoading);
  }, [allSessions, interviewerId, fetchLoading]);
  
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
  
  // Apply filters whenever filter results change
  useEffect(() => {
    setFilteredSessions(filterResults);
  }, [filterResults]);
  
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
  
  // Wrapper for applying filters with interviewers
  const applyFilters = () => {
    applySessionFilters(interviewers);
  };
  
  return { 
    sessions: filteredSessions,  // Original property for backward compatibility
    filteredSessions,           // New property with the filtered results
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
