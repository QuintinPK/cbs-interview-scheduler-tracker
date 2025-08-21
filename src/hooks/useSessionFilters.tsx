
import React, { useState, useEffect } from "react";
import { Session, Interviewer } from "@/types";
import { startOfDay, endOfDay } from "date-fns";

export const useSessionFilters = (sessions: Session[]) => {
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [interviewerCodeFilter, setInterviewerCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // Apply interviewer code filter in real-time whenever it changes
  useEffect(() => {
    let filtered = [...sessions];
    
    if (interviewerCodeFilter.trim()) {
      filtered = filtered.filter(session => {
        // This is a placeholder - the actual filtering will happen in useSessions
        // where we have access to the interviewer data
        return true;
      });
    }
    
    // Apply date filter if set
    if (dateFilter) {
      const localStartOfDay = startOfDay(dateFilter);
      const localEndOfDay = endOfDay(dateFilter);
      
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= localStartOfDay && sessionDate <= localEndOfDay;
      });
    }
    
    setFilteredSessions(filtered);
  }, [sessions, interviewerCodeFilter, dateFilter]);
  
  // Function to apply filters with interviewer data
  const applyFilters = (interviewers?: Interviewer[]) => {
    let filtered = [...sessions];
    
    // Apply interviewer code filter if there's interviewer data
    if (interviewerCodeFilter.trim() && interviewers && interviewers.length > 0) {
      const matchingInterviewers = interviewers.filter(interviewer => 
        interviewer.code.toLowerCase().includes(interviewerCodeFilter.toLowerCase())
      );
      
      if (matchingInterviewers.length > 0) {
        const interviewerIds = matchingInterviewers.map(i => i.id);
        filtered = filtered.filter(session => interviewerIds.includes(session.interviewer_id));
      }
    }
    
    // Apply date filter if set
    if (dateFilter) {
      const localStartOfDay = startOfDay(dateFilter);
      const localEndOfDay = endOfDay(dateFilter);
      
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
