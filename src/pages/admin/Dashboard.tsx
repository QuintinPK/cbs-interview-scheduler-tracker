
import React, { useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ActiveInterviewersCard from "@/components/admin/ActiveInterviewersCard";
import QuickStatsCard from "@/components/admin/QuickStatsCard";
import InactiveInterviewersCard from "@/components/admin/InactiveInterviewersCard";
import WeeklySessionsChart from "@/components/admin/WeeklySessionsChart";
import TopInterviewersChart from "@/components/admin/TopInterviewersChart";
import UnusualSessionsCard from "@/components/admin/UnusualSessionsCard";
import PeakSessionHoursChart from "@/components/admin/PeakSessionHoursChart";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useFilter } from "@/contexts/FilterContext";

const Dashboard = () => {
  const { sessions, interviewers, loading, allInterviewers } = useDataFetching();
  const { selectedProject, selectedIsland } = useFilter();

  // Only show interviewer count for those assigned to selected project if a filter is active
  const totalInterviewersForProject = useMemo(() => {
    if (!selectedProject) return undefined;
    // Only show interviewers assigned to the selected project AND filtered by island if set
    return interviewers.length;
  }, [selectedProject, interviewers, selectedIsland]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {(selectedProject || selectedIsland) && (
            <div className="text-sm text-cbs font-medium bg-blue-50 px-3 py-1 rounded-md mt-2 md:mt-0">
              Filtered by: {selectedProject ? `Project: ${selectedProject.name}` : ''}
              {selectedProject && selectedIsland ? ' & ' : ''}
              {selectedIsland ? `Island: ${selectedIsland}` : ''}
            </div>
          )}
        </div>
        
        {/* Quick Stats at the top */}
        <div>
          <QuickStatsCard 
            sessions={sessions} 
            interviewers={interviewers}
            loading={loading}
            totalInterviewersOverride={totalInterviewersForProject}
          />
        </div>
        
        {/* Weekly Sessions Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklySessionsChart 
            sessions={sessions} 
            loading={loading} 
          />
          <PeakSessionHoursChart
            sessions={sessions}
            loading={loading}
          />
        </div>
        
        {/* Top Interviewers and Unusual Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopInterviewersChart 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
          <UnusualSessionsCard 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
        </div>
        
        {/* Active and Inactive Interviewers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActiveInterviewersCard 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
          <InactiveInterviewersCard 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

