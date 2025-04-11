
import { useState, useEffect } from "react";
import { Session, Interviewer, Interview } from "@/types";

interface CalculatedCosts {
  interviewerCosts: {
    id: string;
    name: string;
    hours: number;
    responses: number;
    nonResponses: number;
    hourlyCost: number;
    responseCost: number;
    nonResponseCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  totalHours: number;
  totalResponses: number;
  totalNonResponses: number;
}

export const useCostsCalculator = (
  sessions: Session[],
  interviewers: Interviewer[],
  interviews: Interview[],
  hourlyRate: number,
  responseRate: number = 0,
  nonResponseRate: number = 0,
  showResponseRates: boolean = false
) => {
  const [calculatedCosts, setCalculatedCosts] = useState<CalculatedCosts>({
    interviewerCosts: [],
    totalCost: 0,
    totalHours: 0,
    totalResponses: 0,
    totalNonResponses: 0
  });

  const calculateCosts = () => {
    // Create maps to track data per interviewer
    const interviewerHours: Map<string, number> = new Map();
    const interviewerNames: Map<string, string> = new Map();
    const interviewerResponses: Map<string, number> = new Map();
    const interviewerNonResponses: Map<string, number> = new Map();

    // Calculate hours for each interviewer
    sessions.forEach((session) => {
      if (!session.is_active && session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const currentHours = interviewerHours.get(session.interviewer_id) || 0;
        interviewerHours.set(session.interviewer_id, currentHours + durationHours);

        // Store interviewer name
        const interviewer = interviewers.find((i) => i.id === session.interviewer_id);
        if (interviewer) {
          interviewerNames.set(
            session.interviewer_id,
            `${interviewer.first_name} ${interviewer.last_name} (${interviewer.code})`
          );
        }
      }
    });

    // Calculate responses and non-responses for each interviewer
    if (showResponseRates) {
      interviews.forEach((interview) => {
        if (!interview.is_active && interview.end_time) {
          const session = sessions.find(s => s.id === interview.session_id);
          if (session) {
            const interviewerId = session.interviewer_id;
            
            if (interview.result === 'response') {
              const currentResponses = interviewerResponses.get(interviewerId) || 0;
              interviewerResponses.set(interviewerId, currentResponses + 1);
            } else if (interview.result === 'non-response') {
              const currentNonResponses = interviewerNonResponses.get(interviewerId) || 0;
              interviewerNonResponses.set(interviewerId, currentNonResponses + 1);
            }
          }
        }
      });
    }

    // Calculate costs for each interviewer
    const interviewerCosts = Array.from(interviewerHours.entries()).map(([id, hours]) => {
      const responses = interviewerResponses.get(id) || 0;
      const nonResponses = interviewerNonResponses.get(id) || 0;
      
      const hourlyCost = hours * hourlyRate;
      const responseCost = showResponseRates ? responses * responseRate : 0;
      const nonResponseCost = showResponseRates ? nonResponses * nonResponseRate : 0;
      const totalCost = hourlyCost + responseCost + nonResponseCost;
      
      return {
        id,
        name: interviewerNames.get(id) || "Unknown",
        hours,
        responses,
        nonResponses,
        hourlyCost,
        responseCost,
        nonResponseCost,
        totalCost,
      };
    });

    // Calculate totals
    const totalHours = interviewerCosts.reduce((sum, item) => sum + item.hours, 0);
    const totalResponses = interviewerCosts.reduce((sum, item) => sum + item.responses, 0);
    const totalNonResponses = interviewerCosts.reduce((sum, item) => sum + item.nonResponses, 0);
    const totalCost = interviewerCosts.reduce((sum, item) => sum + item.totalCost, 0);

    setCalculatedCosts({
      interviewerCosts,
      totalCost,
      totalHours,
      totalResponses,
      totalNonResponses
    });
  };

  useEffect(() => {
    calculateCosts();
  }, [hourlyRate, responseRate, nonResponseRate, showResponseRates, sessions, interviewers, interviews]);

  return {
    calculatedCosts,
    calculateCosts
  };
};
