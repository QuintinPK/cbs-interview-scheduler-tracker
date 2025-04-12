
import { useState } from "react";
import { Session } from "@/types";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useScheduleData } from "@/hooks/useScheduleData";

export const useInterviewerMetrics = (interviewerId?: string, sessions: Session[] = []) => {
  // Get schedules data with the correct parameters
  const { schedulesPerDay } = useScheduleData();
  
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
  } = useInterviewerSessions(sessions, []);
  
  return {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth,
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    schedulesPerDay
  };
};
