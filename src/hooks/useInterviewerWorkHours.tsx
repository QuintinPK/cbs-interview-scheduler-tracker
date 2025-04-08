
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, parseISO, differenceInHours, differenceInSeconds, formatDuration, intervalToDuration } from "date-fns";

export const useInterviewerWorkHours = (interviewerCode?: string) => {
  const { toast } = useToast();
  const [workedHours, setWorkedHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [interviewerId, setInterviewerId] = useState<string | undefined>(undefined);
  const [totalActiveTime, setTotalActiveTime] = useState<string>("0h 0m");
  const [totalActiveSeconds, setTotalActiveSeconds] = useState<number>(0);
  
  // Get interviewer ID from code
  useEffect(() => {
    const getInterviewerId = async () => {
      if (!interviewerCode) {
        setInterviewerId(undefined);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('interviewers')
          .select('id')
          .eq('code', interviewerCode)
          .single();
          
        if (error) throw error;
        
        setInterviewerId(data.id);
      } catch (error) {
        console.error("Error fetching interviewer ID:", error);
        setInterviewerId(undefined);
      }
    };
    
    getInterviewerId();
  }, [interviewerCode]);
  
  // Calculate total active time
  useEffect(() => {
    const calculateTotalActiveTime = async () => {
      if (!interviewerId) {
        setTotalActiveTime("0h 0m");
        setTotalActiveSeconds(0);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get all completed sessions
        const { data: completedSessions, error: completedError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .not('end_time', 'is', null);
          
        if (completedError) throw completedError;
        
        // Get active session if exists
        const { data: activeSessions, error: activeError } = await supabase
          .from('sessions')
          .select('*')
          .eq('interviewer_id', interviewerId)
          .eq('is_active', true)
          .limit(1);
          
        if (activeError) throw activeError;
        
        // Calculate total seconds
        let totalSeconds = 0;
        
        // Add time from completed sessions
        for (const session of completedSessions || []) {
          const start = parseISO(session.start_time);
          const end = parseISO(session.end_time);
          totalSeconds += differenceInSeconds(end, start);
        }
        
        // Add time from active session
        if (activeSessions && activeSessions.length > 0) {
          const activeSession = activeSessions[0];
          const start = parseISO(activeSession.start_time);
          const now = new Date();
          totalSeconds += differenceInSeconds(now, start);
        }
        
        setTotalActiveSeconds(totalSeconds);
        
        // Format the duration
        const duration = intervalToDuration({ start: 0, end: totalSeconds * 1000 });
        const formattedDuration = `${duration.hours! + (duration.days || 0) * 24}h ${duration.minutes}m`;
        setTotalActiveTime(formattedDuration);
      } catch (error) {
        console.error("Error calculating total active time:", error);
        toast({
          title: "Error",
          description: "Could not calculate total active time",
          variant: "destructive",
        });
        setTotalActiveTime("0h 0m");
        setTotalActiveSeconds(0);
      } finally {
        setLoading(false);
      }
    };
    
    calculateTotalActiveTime();
    
    // Set up an interval to update the active time every minute if there's an active session
    const intervalId = setInterval(() => {
      calculateTotalActiveTime();
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [interviewerId, toast]);
  
  const calculateWorkHoursForWeek = async (weekStart: Date) => {
    if (!interviewerId) {
      setWorkedHours(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Convert to ISO strings for the query
      const startDate = weekStart.toISOString();
      const endDate = weekEnd.toISOString();
      
      // Query sessions for the selected interviewer in the given week
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .not('end_time', 'is', null);
        
      if (error) throw error;
      
      // Calculate total worked hours
      let totalHours = 0;
      
      for (const session of data || []) {
        const start = parseISO(session.start_time);
        const end = parseISO(session.end_time);
        const hours = differenceInHours(end, start);
        totalHours += hours;
      }
      
      setWorkedHours(totalHours);
    } catch (error) {
      console.error("Error calculating work hours:", error);
      toast({
        title: "Error",
        description: "Could not calculate worked hours",
        variant: "destructive",
      });
      setWorkedHours(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    workedHours,
    loading,
    calculateWorkHoursForWeek,
    totalActiveTime,
    totalActiveSeconds
  };
};
