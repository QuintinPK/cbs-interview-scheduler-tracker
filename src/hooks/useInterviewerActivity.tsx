
import { useState, useEffect } from "react";
import { Session } from "@/types";
import { 
  calculateDaysSinceLastActive,
  calculateAvgDaysPerWeek,
  calculateDaysWorkedInMonth
} from "@/utils/interviewerMetricsUtils";

export const useInterviewerActivity = (sessions: Session[] = []) => {
  const [daysSinceLastActive, setDaysSinceLastActive] = useState(-1);
  const [avgDaysPerWeek, setAvgDaysPerWeek] = useState(0);
  const [daysWorkedInMonth, setDaysWorkedInMonth] = useState(0);
  
  useEffect(() => {
    setDaysSinceLastActive(calculateDaysSinceLastActive(sessions));
  }, [sessions]);
  
  useEffect(() => {
    setAvgDaysPerWeek(calculateAvgDaysPerWeek(sessions));
  }, [sessions]);
  
  useEffect(() => {
    setDaysWorkedInMonth(calculateDaysWorkedInMonth(sessions));
  }, [sessions]);
  
  return {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth
  };
};
