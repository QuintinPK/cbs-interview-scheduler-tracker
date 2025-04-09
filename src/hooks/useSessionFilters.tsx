
import { useState, useEffect } from "react";
import { Session } from "@/types";

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
      const filterDate = dateFilter.toISOString().split('T')[0];
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
        return sessionDate === filterDate;
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
