
import { useState } from "react";
import { Session } from "@/types";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerAdditionalMetrics } from "@/hooks/useInterviewerAdditionalMetrics";

export const useInterviewerMetrics = (interviewerId?: string, sessions: Session[] = []) => {
  // Get activity metrics
  const { 
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth
  } = useInterviewerActivity(sessions);
  
  // Get session metrics - pass empty schedules array since we removed the schedule dependency
  const {
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime
  } = useInterviewerSessions(sessions, []);
  
  // Get additional metrics
  const {
    completionRate,
    totalInterviews
  } = useInterviewerAdditionalMetrics(sessions);
  
  return {
    // Activity metrics
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    
    // Session metrics
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    
    // Additional metrics
    completionRate,
    totalInterviews,
    
    // Empty schedules array since we removed the schedule dependency
    schedules: []
  };
};
