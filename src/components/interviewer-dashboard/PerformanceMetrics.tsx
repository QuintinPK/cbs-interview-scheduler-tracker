
import React, { useState, useMemo } from "react";
import { Session, Interview, Interviewer } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import { ProjectSelector } from "./ProjectSelector";
import { CompareInterviewer } from "./CompareInterviewer";
import { WeeklyPerformanceCard } from "./WeeklyPerformanceCard";
import { InterviewDurationCard } from "./InterviewDurationCard";
import { AdditionalMetricsCard } from "./AdditionalMetricsCard";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";

interface PerformanceMetricsProps {
  sessions: Session[];
  interviews: Interview[];
  interviewer?: Interviewer | null;
  allInterviewersSessions?: Session[];
  onCompare?: (interviewerId: string) => void;
  showComparisonSelector?: boolean;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  sessions,
  interviews,
  interviewer,
  allInterviewersSessions = [],
  onCompare,
  showComparisonSelector = true
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { projects } = useProjects();
  const { interviewers } = useInterviewers();

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(project => {
      map.set(project.id, project.name);
    });
    return map;
  }, [projects]);

  const projectIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach(session => {
      if (session.project_id) ids.add(session.project_id);
    });
    return Array.from(ids);
  }, [sessions]);

  // Use the custom hook for performance metrics
  const {
    filteredSessions,
    filteredInterviews,
    weeklyAverage,
    averageTimePerType,
    completionRate
  } = usePerformanceMetrics(sessions, interviews, selectedProject);

  // Calculate metrics for all interviewers
  const filteredAllInterviewersSessions = useMemo(() => {
    if (selectedProject === "all") return allInterviewersSessions;
    return allInterviewersSessions.filter(session => session.project_id === selectedProject);
  }, [allInterviewersSessions, selectedProject]);

  // Calculate average for all interviewers
  const calculateWeeklyAverage = (sessions: Session[]) => {
    if (sessions.length === 0) return 0;
    
    const totalMinutes = sessions.reduce((acc, session) => {
      if (session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0);
    
    const firstSession = new Date(sessions[0].start_time);
    const lastSession = new Date(sessions[sessions.length - 1].start_time);
    const weeks = Math.max(1, differenceInWeeks(lastSession, firstSession));
    
    return totalMinutes / weeks / 60; // Convert to hours
  };
  
  const allInterviewersWeeklyAverage = calculateWeeklyAverage(filteredAllInterviewersSessions);

  // Get comparable interviewers (same island and project)
  const comparableInterviewers = useMemo(() => {
    if (!interviewer) return [];
    
    return interviewers.filter(i => 
      i.id !== interviewer.id && 
      i.island === interviewer.island &&
      // Check if they have any projects in common
      projectIds.some(projectId => 
        sessions.some(s => s.project_id === projectId)
      )
    );
  }, [interviewers, interviewer, projectIds, sessions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <ProjectSelector 
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          projectIds={projectIds}
          projectMap={projectMap}
        />

        {interviewer && comparableInterviewers.length > 0 && onCompare && showComparisonSelector && (
          <CompareInterviewer 
            comparableInterviewers={comparableInterviewers}
            onCompare={onCompare}
            currentInterviewerId={interviewer.id}
          />
        )}
      </div>

      <WeeklyPerformanceCard
        weeklyAverage={weeklyAverage}
        allInterviewersWeeklyAverage={allInterviewersWeeklyAverage}
      />
      
      <InterviewDurationCard
        averageTimePerType={averageTimePerType}
      />
      
      <AdditionalMetricsCard
        completionRate={completionRate}
        totalInterviews={filteredInterviews.length}
      />
    </div>
  );
};

import { differenceInWeeks } from "date-fns";
