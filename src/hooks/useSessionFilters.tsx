
import { useState, useEffect } from "react";
import { Session } from "@/types";
import { startOfDay, endOfDay } from "date-fns";

export const useSessionFilters = (sessions: Session[]) => {
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [interviewerCodeFilter, setInterviewerCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // Update filtered sessions when base sessions change
  useEffect(() => {
    setFilteredSessions(sessions);
  }, [sessions]);
  
  const applyFilters = (interviewers: any[] = []) => {
    let filtered = [...sessions];
    
    if (interviewerCodeFilter) {
      const matchingInterviewers = interviewers.filter(interviewer => 
        interviewer.code.toLowerCase().includes(interviewerCodeFilter.toLowerCase())
      );
      
      if (matchingInterviewers.length > 0) {
        const interviewerIds = matchingInterviewers.map(i => i.id);
        filtered = filtered.filter(session => interviewerIds.includes(session.interviewer_id));
      } else {
        filtered = [];
      }
    }
    
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
    setFilteredSessions(sessions);
  };
  
  return {
    filteredSessions,
    interviewerCodeFilter,
    setInterviewerCodeFilter,
    dateFilter,
    setDateFilter,
    applyFilters,
    resetFilters
  };
};
