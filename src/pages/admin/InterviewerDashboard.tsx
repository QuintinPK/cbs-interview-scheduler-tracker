
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

import AdminLayout from "@/components/layout/AdminLayout";
import { useInterviewer } from "@/hooks/useInterviewers";
import { useInterviewerSessions } from "@/hooks/useInterviewerSessions";
import { useInterviewerActivity } from "@/hooks/useInterviewerActivity";
import { useInterviewerWorkHours } from "@/hooks/useInterviewerWorkHours";
import { useInterviewerMetrics } from "@/hooks/useInterviewerMetrics";
import { useProjects } from "@/hooks/useProjects";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const { interviewer, loading: interviewerLoading } = useInterviewer(id || '');
  const { sessions, interviews, loading: sessionsLoading } = useInterviewerSessions(id || '', dateRange);
  const { activeHours, totalInterviews, responseRate } = useInterviewerActivity(sessions, interviews);
  const { workHoursByDay, workHoursByWeek } = useInterviewerWorkHours(sessions);
  const { performanceMetrics } = useInterviewerMetrics(sessions, interviews);
  const { getProjectName } = useProjects();
  
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
          <InterviewerHeader interviewer={interviewer} />
          <GlobalFilter />
        </div>
        
        <InterviewerQuickStats 
          activeHours={activeHours} 
          totalInterviews={totalInterviews} 
          responseRate={responseRate} 
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
                  workHoursByDay={workHoursByDay} 
                  workHoursByWeek={workHoursByWeek} 
                />
                
                <SessionHistory
                  sessions={sessions}
                  interviews={interviews}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showProject={true}
                  projectNameResolver={getProjectName}
                />
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <PerformanceMetrics metrics={performanceMetrics} />
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
