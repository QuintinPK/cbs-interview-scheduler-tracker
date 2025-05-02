
import React from "react";
import SessionHistory from "@/components/interviewer-dashboard/SessionHistory";
import { DateRange } from "react-day-picker";
import { Session } from "@/types";

interface SessionsTabProps {
  sessions: Session[];
  interviews: any[];
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  showProject: boolean;
  projectNameResolver: (projectId: string | null | undefined) => string;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ 
  sessions, 
  interviews, 
  dateRange, 
  setDateRange, 
  showProject,
  projectNameResolver 
}) => {
  return (
    <SessionHistory 
      sessions={sessions}
      interviews={interviews}
      dateRange={dateRange}
      setDateRange={setDateRange}
      showProject={showProject}
      projectNameResolver={projectNameResolver}
    />
  );
};
