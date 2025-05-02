
import React, { useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { OverviewTab } from "@/components/interviewer-dashboard/OverviewTab";
import { SessionsTab } from "@/components/interviewer-dashboard/SessionsTab";
import { PerformanceTab } from "@/components/interviewer-dashboard/PerformanceTab";
import { EvaluationsTab } from "@/components/interviewer-dashboard/EvaluationsTab";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { DateRangePicker } from "@/components/ui/date-range-picker"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInterviewerDashboard } from "@/hooks/useInterviewerDashboard";

const InterviewerDashboard = () => {
  const {
    interviewer,
    loading,
    sessions,
    interviews,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    getProjectName
  } = useInterviewerDashboard();

  // Update page title only when interviewer changes, not on every render
  useEffect(() => {
    if (!loading && interviewer) {
      document.title = `${interviewer.first_name} ${interviewer.last_name}'s Dashboard`;
    } else if (loading) {
      document.title = "Loading...";
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "CBS Interviewer Portal";
    };
  }, [interviewer, loading]);

  // Check for active sessions
  const activeSessions = sessions.filter(s => s.is_active);
  const hasActiveSessions = activeSessions.length > 0;
  
  // Calculate total time
  const totalMinutes = sessions.reduce((total, session) => {
    if (session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return total + ((end.getTime() - start.getTime()) / (1000 * 60));
    }
    return total;
  }, 0);
  
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);
  const totalTime = `${totalHours}h ${remainingMinutes}m`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <InterviewerHeader 
          interviewer={interviewer}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InterviewerQuickStats 
            interviewer={interviewer}
            totalTime={totalTime}
            hasActiveSessions={hasActiveSessions}
          />
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4"
            >
              Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="evaluations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4"
            >
              Evaluations
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4"
            >
              Contact Information
            </TabsTrigger>
          </TabsList>

          <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
          
          <TabsContent value="overview" className="m-0 p-0">
            <OverviewTab sessions={sessions} activeSessions={activeSessions} />
          </TabsContent>

          <TabsContent value="sessions" className="m-0 p-0">
            <SessionsTab 
              sessions={sessions}
              interviews={interviews}
              dateRange={dateRange}
              setDateRange={setDateRange}
              getProjectName={getProjectName}
            />
          </TabsContent>

          <TabsContent value="performance" className="m-0 p-0">
            <PerformanceTab
              sessions={sessions}
              interviews={interviews}
              interviewer={interviewer}
              getProjectName={getProjectName}
            />
          </TabsContent>
          
          <TabsContent value="evaluations" className="m-0 p-0">
            <EvaluationsTab 
              interviewer={interviewer}
            />
          </TabsContent>

          <TabsContent value="contact" className="m-0 p-0">
            <ContactInformation 
              interviewer={interviewer}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
