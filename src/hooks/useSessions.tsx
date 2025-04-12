
import { useState, useEffect } from "react";
import { Session, Interviewer, Island, Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSessionFilters } from "./useSessionFilters";
import { useSessionActions } from "./useSessionActions";
import { useDataFetching } from "./useDataFetching";
import { useToast } from "./use-toast";
import { useProjects } from "./useProjects";

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
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Initialize with sessions specific to the interviewer if ID is provided
  useEffect(() => {
    if (interviewerId) {
      const interviewerSessions = allSessions.filter(
        session => session.interviewer_id === interviewerId
      );
      setSessions(interviewerSessions);
      setFilteredSessions(interviewerSessions);
    } else if (startDate && endDate) {
      // Filter by date range if provided
      const startTS = new Date(startDate).getTime();
      const endTS = new Date(endDate).getTime();
      
      const dateRangeSessions = allSessions.filter(session => {
        const sessionTS = new Date(session.start_time).getTime();
        return sessionTS >= startTS && sessionTS <= endTS;
      });
      
      setSessions(dateRangeSessions);
      setFilteredSessions(dateRangeSessions);
    } else {
      setSessions(allSessions);
      setFilteredSessions(allSessions);
    }
    setLoading(fetchLoading);
  }, [allSessions, interviewerId, startDate, endDate, fetchLoading]);
  
  // Fetch all projects for filtering
  const { projects: allProjects, loading: projectsLoading } = useProjects();
  
  useEffect(() => {
    setProjects(allProjects);
  }, [allProjects]);
  
  // Initialize session filters
  const {
    filteredSessions: filterResults,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    islandFilter,
    setIslandFilter,
    projectFilter,
    setProjectFilter,
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
  
  // Wrapper for applying filters with interviewers and projects
  const applyFilters = () => {
    applySessionFilters(interviewers, projects);
  };
  
  return { 
    sessions: filteredSessions,  // Original property for backward compatibility
    filteredSessions,           // New property with the filtered results
    loading, 
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    islandFilter,
    setIslandFilter,
    projectFilter,
    setProjectFilter,
    getInterviewerCode,
    applyFilters,
    resetFilters: resetSessionFilters,
    stopSession,
    updateSession,
    deleteSession
  };
};
