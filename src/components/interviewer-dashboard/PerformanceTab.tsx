
import React, { useState } from "react";
import { PerformanceMetrics } from "@/components/interviewer-dashboard/PerformanceMetrics";
import { Session, Interviewer } from "@/types";
import { useNavigate, useParams } from "react-router-dom";

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
  const navigate = useNavigate();
  const { interviewerId } = useParams<{ interviewerId: string }>();
  
  const handleCompare = (compareId: string) => {
    if (interviewerId) {
      navigate(`/admin/interviewer/${compareId}?compare=${interviewerId}`);
    }
  };
  
  return (
    <>
      <PerformanceMetrics
        sessions={sessions}
        interviews={interviews}
        interviewer={interviewer}
        allInterviewersSessions={[]} // We'll add this data in useInterviewerDashboard later if needed
        onCompare={handleCompare}
      />
    </>
  );
};
