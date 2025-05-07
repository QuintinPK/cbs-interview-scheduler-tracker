
import React from "react";
import SessionHistory from "@/components/interviewer-dashboard/SessionHistory";
import { Session } from "@/types";

interface SessionsTabProps {
  sessions: Session[];
  interviews: any[];
  showProject: boolean;
  projectNameResolver: (projectId: string | null | undefined) => string;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ 
  sessions, 
  interviews, 
  showProject,
  projectNameResolver 
}) => {
  return (
    <SessionHistory 
      sessions={sessions}
      interviews={interviews}
      showProject={showProject}
      projectNameResolver={projectNameResolver}
    />
  );
};
