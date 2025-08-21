
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  
  const channelRef = useRef<any>(null);
  
  // Function to load sessions data with better error handling
  const loadSessions = useCallback(async () => {
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
      setSessions([]); // Set empty array on error to prevent crashes
    } finally {
      setLoading(false);
    }
  }, [interviewerId, startDate, endDate, toast]);
  
  // Set up real-time listener for sessions with better cleanup
  useEffect(() => {
    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    loadSessions();
    
    // Set up real-time listener for new sessions with unique channel name
    const channelName = `sessions_${Date.now()}_${Math.random()}`;
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sessions' 
      }, (payload) => {
        console.log('Real-time session update:', payload);
        try {
          if (payload.eventType === 'INSERT') {
            setSessions(current => {
              // Prevent duplicates
              const exists = current.some(s => s.id === payload.new.id);
              return exists ? current : [payload.new as Session, ...current];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSessions(current => 
              current.map(session => 
                session.id === payload.new.id ? { ...session, ...payload.new } as Session : session
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSessions(current => 
              current.filter(session => session.id !== payload.old.id)
            );
          }
        } catch (error) {
          console.error('Error handling real-time session update:', error);
        }
      })
      .subscribe((status) => {
        console.log('Session subscription status:', status);
      });
      
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadSessions]);
  
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
  const { 
    stopSession, 
    updateSession, 
    deleteSession 
  } = useSessionActions(
    sessions, 
    setSessions,
    filterResults,
    setLoading,
    toast
  );
  
  // Helper function to get interviewer code from ID with null checks
  const getInterviewerCode = useCallback((interviewerId: string): string => {
    if (!interviewerId || !interviewers?.length) return "Unknown";
    try {
      const interviewer = interviewers.find(i => i?.id === interviewerId);
      return interviewer?.code || "Unknown";
    } catch (error) {
      console.error('Error getting interviewer code:', error);
      return "Unknown";
    }
  }, [interviewers]);
  
  // Filter sessions based on global filters and session-specific filters with null checks
  const filteredSessions = filterResults.filter(session => {
    if (!session) return false;
    
    try {
      // Apply global project filter if set
      const matchesProject = !selectedProject || session.project_id === selectedProject?.id;
      
      // Apply global island filter if set
      let matchesIsland = true;
      if (selectedIsland && interviewers?.length > 0) {
        const sessionInterviewer = interviewers.find(i => i?.id === session.interviewer_id);
        matchesIsland = sessionInterviewer?.island === selectedIsland;
      }
      
      // Apply interviewer code filter
      let matchesInterviewerCode = true;
      if (interviewerCodeFilter?.trim() && interviewers?.length > 0) {
        const interviewerCode = getInterviewerCode(session.interviewer_id);
        matchesInterviewerCode = interviewerCode.toLowerCase().includes(interviewerCodeFilter.toLowerCase());
      }
      
      return matchesProject && matchesIsland && matchesInterviewerCode;
    } catch (error) {
      console.error('Error filtering session:', error, session);
      return false;
    }
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
    sessions: filteredSessions, // Changed from 'filteredSessions' to match what's used in Sessions.tsx
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
