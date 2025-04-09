
import { Session, Schedule } from "@/types";
import { 
  differenceInDays, differenceInMinutes, 
  subDays, isSameDay, parseISO
} from "date-fns";

/**
 * Calculate days since the interviewer was last active
 */
export const calculateDaysSinceLastActive = (sessions: Session[]): number => {
  if (sessions.length === 0) {
    return -1;
  }
  
  const mostRecentSession = sessions[0]; // Assuming sessions are ordered by date desc
  const lastActiveDate = new Date(mostRecentSession.start_time);
  const today = new Date();
  
  return differenceInDays(today, lastActiveDate);
};

/**
 * Calculate average days worked per week
 */
export const calculateAvgDaysPerWeek = (sessions: Session[]): number => {
  if (sessions.length === 0) {
    return 0;
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
  
  return uniqueDays.size / totalWeeks;
};

/**
 * Calculate days worked in past month
 */
export const calculateDaysWorkedInMonth = (sessions: Session[]): number => {
  if (sessions.length === 0) {
    return 0;
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
  
  return uniqueDays.size;
};

/**
 * Calculate percentage of sessions within planned timeframe
 */
export const calculateSessionsInPlanTime = (sessions: Session[], schedules: Schedule[]): number => {
  if (sessions.length === 0 || schedules.length === 0) {
    return 0;
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
  
  return (inScheduleCount / sessions.length) * 100;
};

/**
 * Calculate average session duration
 */
export const calculateAvgSessionDuration = (sessions: Session[]): string => {
  const completedSessions = sessions.filter(s => s.start_time && s.end_time && !s.is_active);
  
  if (completedSessions.length === 0) {
    return "0m";
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
  
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/**
 * Calculate earliest start time and latest end time
 */
export const calculateWorkingHours = (sessions: Session[]): {
  earliestStartTime: Date | null;
  latestEndTime: Date | null;
} => {
  if (sessions.length === 0) {
    return {
      earliestStartTime: null,
      latestEndTime: null
    };
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
  
  return {
    earliestStartTime: earliest,
    latestEndTime: latest
  };
};
