
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

import AdminLayout from "@/components/layout/AdminLayout";
import { useInterviewer } from "@/hooks/useInterviewer";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerWorkHours } from "@/hooks/useInterviewerWorkHours";
import { useSessions } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { useInterviewers } from "@/hooks/useInterviewers";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { ActivitySummary } from "@/components/interviewer-dashboard/ActivitySummary";
import SessionHistory from "@/components/interviewer-dashboard/SessionHistory";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { PerformanceMetrics } from "@/components/interviewer-dashboard/PerformanceMetrics";
import GlobalFilter from "@/components/GlobalFilter";
import EvaluationsCard from "@/components/interviewer/EvaluationsCard";

const InterviewerDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const { interviewer, loading: interviewerLoading } = useInterviewer(id || '');
  const { interviewers } = useInterviewers();
  const { sessions, sessionsInPlanTime, avgSessionDuration, earliestStartTime, latestEndTime, loading: sessionsLoading } = useInterviewerSessions([], []);
  const { sessions: allSessions } = useSessions();
  const { daysSinceLastActive, avgDaysPerWeek, daysWorkedInMonth } = useInterviewerActivity([]);
  const { totalActiveTime, totalActiveSeconds } = useInterviewerWorkHours();
  const { projects } = useProjects();
  
  // Mock empty interviews array for now
  const interviews = [];
  
  // Mock active sessions
  const activeSessions = [];
  
  const getProjectName = (id: string) => {
    const project = projects.find(p => p.id === id);
    return project ? project.name : 'Unknown Project';
  };
  
  // Determine if interviewer has active sessions
  const hasActiveSessions = false; // To be updated when we have session data
  
  // Handle interviewer comparison
  const handleCompare = useCallback((comparisonId: string) => {
    if (comparisonId === id) return;
    navigate(`/admin/interviewer/${comparisonId}`);
  }, [navigate, id]);
  
  if (interviewerLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </AdminLayout>
    );
  }
  
  if (!interviewer) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-gray-700">Interviewer not found</h2>
          <p className="text-muted-foreground mt-2">
            The interviewer you're looking for doesn't exist or may have been deleted.
          </p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <InterviewerHeader interviewer={interviewer} loading={interviewerLoading} />
          <GlobalFilter />
        </div>
        
        <InterviewerQuickStats 
          interviewer={interviewer}
          totalTime={totalActiveTime}
          hasActiveSessions={hasActiveSessions}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-3 h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
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
                
                <SessionHistory
                  sessions={sessions || []}
                  interviews={interviews}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showProject={true}
                  projectNameResolver={getProjectName}
                />
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <PerformanceMetrics 
                  sessions={sessions}
                  interviews={interviews}
                  interviewer={interviewer}
                  allInterviewersSessions={allSessions}
                  interviewers={interviewers}
                  onCompare={handleCompare}
                />
              </TabsContent>
              
              <TabsContent value="evaluations" className="space-y-4">
                <EvaluationsCard 
                  interviewerId={interviewer.id} 
                  projectNameResolver={getProjectName} 
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <ContactInformation interviewer={interviewer} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
