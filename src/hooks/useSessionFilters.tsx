
import { useState, useEffect } from "react";
import { Session, Interviewer, Island, Project } from "@/types";
import { startOfDay, endOfDay } from "date-fns";

export const useSessionFilters = (sessions: Session[]) => {
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [interviewerCodeFilter, setInterviewerCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [islandFilter, setIslandFilter] = useState<Island | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  
  // Update filtered sessions when base sessions change
  useEffect(() => {
    setFilteredSessions(sessions);
  }, [sessions]);
  
  const applyFilters = (interviewers: Interviewer[] = [], projects: Project[] = []) => {
    let filtered = [...sessions];
    
    // Filter by interviewer code
    if (interviewerCodeFilter) {
      const matchingInterviewers = interviewers.filter(interviewer => 
        interviewer.code.toLowerCase().includes(interviewerCodeFilter.toLowerCase())
      );
      
      if (matchingInterviewers.length > 0) {
        const interviewerIds = matchingInterviewers.map(i => i.id);
        filtered = filtered.filter(session => interviewerIds.includes(session.interviewer_id));
      }
    }
    
    // Filter by project
    if (projectFilter) {
      filtered = filtered.filter(session => session.project_id === projectFilter);
    }
    
    // Filter by island (via projects)
    if (islandFilter && projects.length > 0) {
      const projectIds = projects
        .filter(project => project.island === islandFilter)
        .map(project => project.id);
        
      filtered = filtered.filter(session => 
        session.project_id && projectIds.includes(session.project_id)
      );
    }
    
    // Filter by date
    if (dateFilter) {
      // Create start and end of the selected day in local timezone
      const localStartOfDay = startOfDay(dateFilter);
      const localEndOfDay = endOfDay(dateFilter);
      
      // Filter sessions where the start_time falls within the local day range
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= localStartOfDay && sessionDate <= localEndOfDay;
      });
    }
    
    setFilteredSessions(filtered);
  };
  
  const resetFilters = () => {
    setInterviewerCodeFilter("");
    setDateFilter(undefined);
    setIslandFilter(null);
    setProjectFilter(null);
    setFilteredSessions(sessions);
  };
  
  return {
    filteredSessions,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    islandFilter,
    setIslandFilter,
    projectFilter,
    setProjectFilter,
    applyFilters,
    resetFilters
  };
};
