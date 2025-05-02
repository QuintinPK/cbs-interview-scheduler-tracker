
import { useState, useEffect, useCallback } from "react";
import { Session, Schedule } from "@/types";
import { 
  calculateSessionsInPlanTime,
  calculateAvgSessionDuration,
  calculateWorkingHours
} from "@/utils/interviewerMetricsUtils";

/**
 * Hook to calculate and manage metrics related to interviewer sessions
 */
export const useInterviewerSessions = (sessions: Session[] = [], schedules: Schedule[] = []) => {
  const [sessionsInPlanTime, setSessionsInPlanTime] = useState(0);
  const [avgSessionDuration, setAvgSessionDuration] = useState("0m");
  const [earliestStartTime, setEarliestStartTime] = useState<Date | null>(null);
  const [latestEndTime, setLatestEndTime] = useState<Date | null>(null);
  
  // Calculate sessions in plan time
  useEffect(() => {
    setSessionsInPlanTime(calculateSessionsInPlanTime(sessions, schedules));
  }, [sessions, schedules]);
  
  // Calculate average session duration
  useEffect(() => {
    setAvgSessionDuration(calculateAvgSessionDuration(sessions));
  }, [sessions]);
  
  // Calculate working hours (earliest start and latest end)
  useEffect(() => {
    const { earliestStartTime: earliest, latestEndTime: latest } = calculateWorkingHours(sessions);
    setEarliestStartTime(earliest);
    setLatestEndTime(latest);
  }, [sessions]);
  
  return {
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime
  };
};
