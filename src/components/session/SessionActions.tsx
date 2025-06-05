
import React from "react";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";
import InterviewButton from "../interview/InterviewButton";
import SessionButton from "./SessionButton";

interface SessionActionsProps {
  isRunning: boolean;
  loading: boolean;
  interviewerCode: string;
  activeInterview: any;
  isInterviewLoading: boolean;
  availableProjects: Project[];
  onStartStop: () => void;
  onInterviewAction: () => void;
  syncState: {
    isOffline: boolean;
    unsyncedSessions: number;
    unsyncedInterviews: number;
  };
}

const SessionActions: React.FC<SessionActionsProps> = ({
  isRunning,
  loading,
  interviewerCode,
  activeInterview,
  isInterviewLoading,
  availableProjects,
  onStartStop,
  onInterviewAction,
  syncState
}) => {
  return (
    <div className="flex flex-col gap-4">
      {isRunning && (
        <InterviewButton
          isInterviewActive={!!activeInterview}
          loading={isInterviewLoading}
          onClick={onInterviewAction}
          disabled={loading}
        />
      )}
      
      <SessionButton
        isRunning={isRunning}
        loading={loading}
        interviewerCode={interviewerCode}
        onClick={onStartStop}
        disabled={isRunning && !!activeInterview}
        isOffline={syncState.isOffline}
        unsyncedCount={syncState.unsyncedSessions + syncState.unsyncedInterviews}
      />
    </div>
  );
};

export default SessionActions;
