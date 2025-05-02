
import { useState } from "react";
import { Session } from "@/types";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useInterviewerAdditionalMetrics } from "@/hooks/useInterviewerAdditionalMetrics";

export const useInterviewerMetrics = (interviewerId?: string, sessions: Session[] = []) => {
  // Get schedules data
  const { schedules } = useScheduleData(interviewerId);
  
  // Get activity metrics
  const { 
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth
  } = useInterviewerActivity(sessions);
  
  // Get session metrics
  const {
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime
  } = useInterviewerSessions(sessions, schedules);
  
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
    
    // Raw data
    schedules
  };
};
