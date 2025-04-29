
import { useState, useEffect } from "react";
import { Session, Schedule } from "@/types";
import { 
  calculateSessionsInPlanTime,
  calculateAvgSessionDuration,
  calculateWorkingHours
} from "@/utils/interviewerMetricsUtils";

export const useInterviewerSessions = (sessions: Session[] = [], schedules: Schedule[] = []) => {
  const [sessionsInPlanTime, setSessionsInPlanTime] = useState(0);
  const [avgSessionDuration, setAvgSessionDuration] = useState("0m");
  const [earliestStartTime, setEarliestStartTime] = useState<Date | null>(null);
  const [latestEndTime, setLatestEndTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setSessionsInPlanTime(calculateSessionsInPlanTime(sessions, schedules));
  }, [sessions, schedules]);
  
  useEffect(() => {
    setAvgSessionDuration(calculateAvgSessionDuration(sessions));
  }, [sessions]);
  
  useEffect(() => {
    const { earliestStartTime: earliest, latestEndTime: latest } = calculateWorkingHours(sessions);
    setEarliestStartTime(earliest);
    setLatestEndTime(latest);
  }, [sessions]);
  
  return {
    sessionsInPlanTime,
    avgSessionDuration,
    earliestStartTime,
    latestEndTime,
    sessions,
    loading: false
  };
};
