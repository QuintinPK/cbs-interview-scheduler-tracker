
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { InterviewerHeader } from "@/components/interviewer-dashboard/InterviewerHeader";
import { InterviewerQuickStats } from "@/components/interviewer-dashboard/InterviewerQuickStats";
import { OverviewTab } from "@/components/interviewer-dashboard/OverviewTab";
import { SessionsTab } from "@/components/interviewer-dashboard/SessionsTab";
import { ProjectsTab } from "@/components/interviewer-dashboard/ProjectsTab";
import { PerformanceTab } from "@/components/interviewer-dashboard/PerformanceTab";
import { EvaluationsTab } from "@/components/interviewer-dashboard/EvaluationsTab";
import { ContactInformation } from "@/components/interviewer-dashboard/ContactInformation";
import { InterviewerSchedulingTab } from "@/components/interviewer-dashboard/InterviewerSchedulingTab";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInterviewerDashboard } from "@/hooks/useInterviewerDashboard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

// Error boundary component for dashboard tabs
class TabErrorBoundary extends React.Component<{ 
  children: React.ReactNode,
  onError?: () => void,
  tabName: string 
}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Error in ${this.props.tabName} tab:`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError();
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center border rounded-md bg-red-50 border-red-200">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error loading {this.props.tabName}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            There was a problem loading this content. Please try refreshing the page.
          </p>
          <Button 
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const InterviewerDashboard = () => {
  const {
    interviewer,
    loading,
    error,
    sessions,
    interviews,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    getProjectName,
    getInterviewerProjects,
    assignedProjects,
    refreshData,
    compareInterviewer,
    compareSessions
  } = useInterviewerDashboard();
  
  // Local states for performance optimization
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Update page title whenever interviewer changes
  useEffect(() => {
    let title = "CBS Interviewer Portal";
    if (interviewer) {
      title = `${interviewer.first_name} ${interviewer.last_name}'s Dashboard`;
    } else if (loading) {
      title = "Loading...";
    }
    document.title = title;

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "CBS Interviewer Portal";
    };
  }, [interviewer, loading]);
  
  // Show error toast when error is detected
  useEffect(() => {
    if (error) {
      toast.error("Error loading interviewer data", {
        description: "Please try refreshing the page.",
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    }
  }, [error]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshData();
      setLastRefreshTime(new Date());
      toast.success("Data refreshed successfully");
    } catch (err) {
      console.error("Error refreshing data:", err);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total time
  const totalMinutes = sessions.reduce((total, session) => {
    if (session.end_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }
    return total;
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.round(totalMinutes % 60);
  const totalTime = `${totalHours}h ${remainingMinutes}m`;
  
  // Check for active sessions
  const activeSessions = sessions.filter(s => s.is_active);
  const hasActiveSessions = activeSessions.length > 0;
  
  // Loading skeleton for main content
  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-20 bg-gray-100 rounded-md animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (error || !interviewer) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Could not load interviewer data</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the interviewer information. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <InterviewerHeader 
          interviewer={interviewer} 
          loading={false} 
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastRefreshTime={lastRefreshTime}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InterviewerQuickStats 
            interviewer={interviewer} 
            totalTime={totalTime} 
            hasActiveSessions={hasActiveSessions} 
          />
        </div>

        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-8 border-b w-full justify-start rounded-none h-auto p-0 bg-transparent overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Overview
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Projects
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Performance
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Evaluations
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-4 whitespace-nowrap">
              Contact Info
            </TabsTrigger>
          </TabsList>

          <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
          
          <TabsContent value="overview" className="m-0 p-0">
            <TabErrorBoundary tabName="Overview">
              <OverviewTab sessions={sessions} activeSessions={activeSessions} />
            </TabErrorBoundary>
          </TabsContent>

          <TabsContent value="scheduling" className="m-0 p-0">
            <TabErrorBoundary tabName="Scheduling">
              <InterviewerSchedulingTab interviewer={interviewer} />
            </TabErrorBoundary>
          </TabsContent>

          <TabsContent value="sessions" className="m-0 p-0">
            <TabErrorBoundary tabName="Sessions">
              <SessionsTab 
                sessions={sessions} 
                interviews={interviews} 
                dateRange={dateRange} 
                setDateRange={setDateRange} 
                showProject={true} 
                projectNameResolver={getProjectName} 
              />
            </TabErrorBoundary>
          </TabsContent>
          
          <TabsContent value="projects" className="m-0 p-0">
            <TabErrorBoundary tabName="Projects">
              <ProjectsTab 
                interviewer={interviewer} 
                assignedProjects={assignedProjects} 
                refreshData={refreshData} 
              />
            </TabErrorBoundary>
          </TabsContent>

          <TabsContent value="performance" className="m-0 p-0">
            <TabErrorBoundary tabName="Performance">
              <PerformanceTab 
                sessions={sessions} 
                interviews={interviews} 
                interviewer={interviewer} 
                getProjectName={getProjectName} 
                compareInterviewer={compareInterviewer} 
                compareSessions={compareSessions} 
              />
            </TabErrorBoundary>
          </TabsContent>
          
          <TabsContent value="evaluations" className="m-0 p-0">
            <TabErrorBoundary tabName="Evaluations">
              <EvaluationsTab 
                interviewer={interviewer} 
                getProjectName={getProjectName} 
              />
            </TabErrorBoundary>
          </TabsContent>

          <TabsContent value="contact" className="m-0 p-0">
            <TabErrorBoundary tabName="Contact Information">
              <ContactInformation interviewer={interviewer} />
            </TabErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default InterviewerDashboard;
