
import { useState, useEffect } from "react";
import { Session } from "@/types";

export const useInterviewerAdditionalMetrics = (sessions: Session[] = []) => {
  const [completionRate, setCompletionRate] = useState(0);
  
  useEffect(() => {
    if (sessions.length === 0) {
      setCompletionRate(0);
      return;
    }
    
    // Count completed sessions (those with end_time)
    const completedSessions = sessions.filter(s => s.end_time !== null && !s.is_active);
    const rate = (completedSessions.length / sessions.length) * 100;
    setCompletionRate(rate);
  }, [sessions]);
  
  return {
    completionRate,
    totalInterviews: sessions.length,
  };
};
