
import { useState, useEffect } from "react";
import { Session, Interviewer } from "@/types";

interface CalculatedCosts {
  interviewerCosts: {
    id: string;
    name: string;
    hours: number;
    cost: number;
  }[];
  totalCost: number;
  totalHours: number;
}

export const useCostsCalculator = (
  sessions: Session[],
  interviewers: Interviewer[],
  hourlyRate: number
) => {
  const [calculatedCosts, setCalculatedCosts] = useState<CalculatedCosts>({
    interviewerCosts: [],
    totalCost: 0,
    totalHours: 0
  });

  const calculateCosts = () => {
    // Create a map to track hours per interviewer
    const interviewerHours: Map<string, number> = new Map();
    const interviewerNames: Map<string, string> = new Map();

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

    // Calculate costs for each interviewer
    const interviewerCosts = Array.from(interviewerHours.entries()).map(([id, hours]) => ({
      id,
      name: interviewerNames.get(id) || "Unknown",
      hours,
      cost: hours * hourlyRate,
    }));

    // Calculate total hours and cost
    const totalHours = interviewerCosts.reduce((sum, item) => sum + item.hours, 0);
    const totalCost = interviewerCosts.reduce((sum, item) => sum + item.cost, 0);

    setCalculatedCosts({
      interviewerCosts,
      totalCost,
      totalHours
    });
  };

  useEffect(() => {
    calculateCosts();
  }, [hourlyRate, sessions, interviewers]);

  return {
    calculatedCosts,
    calculateCosts
  };
};
