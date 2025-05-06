
import React from "react";
import { PerformanceMetrics } from "@/components/interviewer-dashboard/PerformanceMetrics";
import EvaluationsCard from "@/components/interviewer/EvaluationsCard";
import { Session, Interviewer } from "@/types";

interface PerformanceTabProps {
  sessions: Session[];
  interviews: any[];
  interviewer: Interviewer | null;
  getProjectName: (projectId: string | null | undefined) => string;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ 
  sessions, 
  interviews, 
  interviewer,
  getProjectName 
}) => {
  return (
    <>
      <PerformanceMetrics
        sessions={sessions}
        interviews={interviews}
        interviewer={interviewer}
      />

      {interviewer && (
        <div className="mt-6">
          <EvaluationsCard
            interviewer={interviewer}
            projectNameResolver={getProjectName}
          />
        </div>
      )}
    </>
  );
};
