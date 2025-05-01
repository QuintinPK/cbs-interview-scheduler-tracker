
import React from "react";
import { ActivitySummary } from "@/components/interviewer-dashboard/ActivitySummary";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerMetrics } from "@/hooks/useInterviewerMetrics";
import { Session } from "@/types";

interface OverviewTabProps {
  sessions: Session[];
  activeSessions: Session[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ sessions, activeSessions }) => {
  // Calculate metrics
  const { 
    sessionsInPlanTime, 
    avgSessionDuration, 
    earliestStartTime, 
    latestEndTime 
  } = useInterviewerSessions(sessions);

  const {
    daysSinceLastActive,
    avgDaysPerWeek,
    daysWorkedInMonth
  } = useInterviewerMetrics(undefined, sessions);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3">
        <ActivitySummary 
          sessions={sessions}
          daysSinceLastActive={daysSinceLastActive}
          avgDaysPerWeek={avgDaysPerWeek}
          daysWorkedInMonth={daysWorkedInMonth}
          sessionsInPlanTime={sessionsInPlanTime}
          avgSessionDuration={avgSessionDuration}
          earliestStartTime={earliestStartTime}
          latestEndTime={latestEndTime}
          activeSessions={activeSessions}
        />
      </div>
    </div>
  );
};
