
import { useMemo, useState } from "react";
import { Session, Interview } from "@/types";

export const usePerformanceMetrics = (
  sessions: Session[], 
  interviews: Interview[],
  selectedProject: string
) => {
  // Filter sessions and interviews based on selected project
  const filteredSessions = useMemo(() => {
    if (selectedProject === "all") return sessions;
    return sessions.filter(session => session.project_id === selectedProject);
  }, [sessions, selectedProject]);

  const filteredInterviews = useMemo(() => {
    if (selectedProject === "all") return interviews;
    return interviews.filter(interview => interview.project_id === selectedProject);
  }, [interviews, selectedProject]);

  // Calculate weekly average
  const calculateWeeklyAverage = (sessionData: Session[]) => {
    if (sessionData.length === 0) return 0;
    
    const totalMinutes = sessionData.reduce((acc, session) => {
      if (session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0);
    
    const firstSession = new Date(sessionData[0].start_time);
    const lastSession = new Date(sessionData[sessionData.length - 1].start_time);
    const weeks = Math.max(1, differenceInWeeks(lastSession, firstSession));
    
    return totalMinutes / weeks / 60; // Convert to hours
  };

  const weeklyAverage = useMemo(() => calculateWeeklyAverage(filteredSessions), [filteredSessions]);

  // Calculate average time per interview type
  const averageTimePerType = useMemo(() => {
    const responseInterviews = filteredInterviews.filter(i => i.result === 'response' && i.end_time);
    const nonResponseInterviews = filteredInterviews.filter(i => i.result === 'non-response' && i.end_time);
    
    const calcAverage = (interviewData: Interview[]) => {
      if (interviewData.length === 0) return 0;
      const totalMinutes = interviewData.reduce((acc, interview) => {
        const start = new Date(interview.start_time);
        const end = new Date(interview.end_time!);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
      return totalMinutes / interviewData.length;
    };
    
    return {
      response: calcAverage(responseInterviews),
      nonResponse: calcAverage(nonResponseInterviews)
    };
  }, [filteredInterviews]);

  // Calculate completion rate
  const completionRate = useMemo(() => {
    return filteredInterviews.length > 0 
      ? (filteredInterviews.filter(i => i.result === 'response').length / filteredInterviews.length) * 100 
      : 0;
  }, [filteredInterviews]);

  return {
    filteredSessions,
    filteredInterviews,
    weeklyAverage,
    averageTimePerType,
    completionRate
  };
};

import { differenceInWeeks } from "date-fns";
