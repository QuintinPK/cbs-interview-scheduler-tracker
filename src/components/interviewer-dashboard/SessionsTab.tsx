
import React from "react";
import SessionHistory from "./SessionHistory";
import { Session, Interview } from "@/types";

interface SessionsTabProps {
  sessions: Session[];
  interviews: Interview[];
  showProject: boolean;
  projectNameResolver: (id: string | null | undefined) => string;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  interviews,
  showProject,
  projectNameResolver,
}) => {
  return (
    <div className="space-y-6">
      <SessionHistory 
        sessions={sessions} 
        interviews={interviews}
        showProject={showProject}
        projectNameResolver={projectNameResolver}
      />
    </div>
  );
};
