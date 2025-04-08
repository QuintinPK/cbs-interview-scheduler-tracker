
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Session, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation } from "@/lib/utils";

export const useSessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [interviewerCodeFilter, setInterviewerCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
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
      setFilteredSessions(transformedSessions);
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
  
  const applyFilters = () => {
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
  
  const stopSession = async (session: Session) => {
    try {
      setLoading(true);
      
      const currentLocation = await getCurrentLocation();
      
      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          end_latitude: currentLocation?.latitude || null,
          end_longitude: currentLocation?.longitude || null,
          end_address: currentLocation?.address || null,
          is_active: false
        })
        .eq('id', session.id);
        
      if (error) throw error;
      
      await loadData();
      
      toast({
        title: "Session Stopped",
        description: `Session for ${getInterviewerCode(session.interviewer_id)} has been stopped.`,
      });
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: "Could not stop session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateSession = async (sessionId: string, updateData: Partial<Session>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);
        
      if (error) throw error;
      
      await loadData();
      
      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Could not update session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      
      setSessions(sessions.filter(s => s.id !== sessionId));
      setFilteredSessions(filteredSessions.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Could not delete session",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
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
