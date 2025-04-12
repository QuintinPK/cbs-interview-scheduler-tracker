
import { useState } from "react";
import { Session } from "@/types";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useSchedules } from "@/hooks/useSchedules";

export const useInterviewerMetrics = (interviewerId?: string, sessions: Session[] = []) => {
  // Get schedules data
  const { schedules } = useSchedules(interviewerId);
  
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
  
  return {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    schedules
  };
};
