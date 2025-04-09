
import { useState, useEffect } from "react";
import { Session, Schedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  differenceInDays, differenceInMinutes, 
  subDays, startOfDay, format,
  isSameDay, parseISO
} from "date-fns";

export const useInterviewerMetrics = (interviewerId?: string, sessions: Session[] = []) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [daysSinceLastActive, setDaysSinceLastActive] = useState(-1);
  const [avgDaysPerWeek, setAvgDaysPerWeek] = useState(0);
  const [daysWorkedInMonth, setDaysWorkedInMonth] = useState(0);
  const [sessionsInPlanTime, setSessionsInPlanTime] = useState(0);
  const [avgSessionDuration, setAvgSessionDuration] = useState("0m");
  const [earliestStartTime, setEarliestStartTime] = useState<Date | null>(null);
  const [latestEndTime, setLatestEndTime] = useState<Date | null>(null);
  
  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!interviewerId) return;
      
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('interviewer_id', interviewerId);
          
        if (error) throw error;
        
        setSchedules(data || []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    };
    
    fetchSchedules();
  }, [interviewerId]);
  
  // Calculate days since last active
  useEffect(() => {
    if (sessions.length === 0) {
      setDaysSinceLastActive(-1);
      return;
    }
    
    const mostRecentSession = sessions[0]; // Assuming sessions are ordered by date desc
    const lastActiveDate = new Date(mostRecentSession.start_time);
    const today = new Date();
    
    setDaysSinceLastActive(differenceInDays(today, lastActiveDate));
  }, [sessions]);
  
  // Calculate average days worked per week
  useEffect(() => {
    if (sessions.length === 0) {
      setAvgDaysPerWeek(0);
      return;
    }
    
    // Get unique days worked
    const uniqueDays = new Set();
    sessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0];
      uniqueDays.add(date);
    });
    
    // Get oldest session date
    const oldestSessionDate = new Date(sessions[sessions.length - 1].start_time);
    const today = new Date();
    
    // Calculate weeks between oldest session and today
    const totalWeeks = Math.max(1, differenceInDays(today, oldestSessionDate) / 7);
    
    setAvgDaysPerWeek(uniqueDays.size / totalWeeks);
  }, [sessions]);
  
  // Calculate days worked in past month
  useEffect(() => {
    if (sessions.length === 0) {
      setDaysWorkedInMonth(0);
      return;
    }
    
    const oneMonthAgo = subDays(new Date(), 30);
    
    // Get unique days worked in the past month
    const uniqueDays = new Set();
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      if (sessionDate >= oneMonthAgo) {
        const date = sessionDate.toISOString().split('T')[0];
        uniqueDays.add(date);
      }
    });
    
    setDaysWorkedInMonth(uniqueDays.size);
  }, [sessions]);
  
  // Calculate % of sessions within planned timeframe
  useEffect(() => {
    if (sessions.length === 0 || schedules.length === 0) {
      setSessionsInPlanTime(0);
      return;
    }
    
    let inScheduleCount = 0;
    
    sessions.forEach(session => {
      const sessionStart = new Date(session.start_time);
      
      // Check if the session falls within any scheduled timeframe
      const isInSchedule = schedules.some(schedule => {
        const scheduleStart = new Date(schedule.start_time);
        const scheduleEnd = new Date(schedule.end_time);
        
        return sessionStart >= scheduleStart && sessionStart <= scheduleEnd;
      });
      
      if (isInSchedule) {
        inScheduleCount++;
      }
    });
    
    setSessionsInPlanTime((inScheduleCount / sessions.length) * 100);
  }, [sessions, schedules]);
  
  // Calculate average session duration
  useEffect(() => {
    const completedSessions = sessions.filter(s => s.start_time && s.end_time && !s.is_active);
    
    if (completedSessions.length === 0) {
      setAvgSessionDuration("0m");
      return;
    }
    
    let totalMinutes = 0;
    
    completedSessions.forEach(session => {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time!);
      totalMinutes += differenceInMinutes(end, start);
    });
    
    const avgMinutes = totalMinutes / completedSessions.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    
    setAvgSessionDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
  }, [sessions]);
  
  // Calculate earliest start time and latest end time
  useEffect(() => {
    if (sessions.length === 0) {
      setEarliestStartTime(null);
      setLatestEndTime(null);
      return;
    }
    
    let earliest: Date | null = null;
    let latest: Date | null = null;
    
    sessions.forEach(session => {
      const start = new Date(session.start_time);
      
      // Create a reference time at midnight for comparing only the time component
      const startTimeOnly = new Date(0, 0, 0, start.getHours(), start.getMinutes(), 0);
      
      if (!earliest || startTimeOnly < earliest) {
        earliest = startTimeOnly;
      }
      
      if (session.end_time) {
        const end = new Date(session.end_time);
        const endTimeOnly = new Date(0, 0, 0, end.getHours(), end.getMinutes(), 0);
        
        if (!latest || endTimeOnly > latest) {
          latest = endTimeOnly;
        }
      }
    });
    
    setEarliestStartTime(earliest);
    setLatestEndTime(latest);
  }, [sessions]);
  
  return {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime
  };
};
