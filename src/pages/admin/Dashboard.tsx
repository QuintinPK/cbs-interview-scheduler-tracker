
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ActiveInterviewersCard from "@/components/admin/ActiveInterviewersCard";
import QuickStatsCard from "@/components/admin/QuickStatsCard";
import InactiveInterviewersCard from "@/components/admin/InactiveInterviewersCard";
import WeeklySessionsChart from "@/components/admin/WeeklySessionsChart";
import TopInterviewersChart from "@/components/admin/TopInterviewersChart";
import UnusualSessionsCard from "@/components/admin/UnusualSessionsCard";
import { useDataFetching } from "@/hooks/useDataFetching";

const Dashboard = () => {
  const { sessions, interviewers, loading } = useDataFetching();
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Quick Stats at the top */}
        <div>
          <QuickStatsCard 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklySessionsChart 
            sessions={sessions} 
            loading={loading} 
          />
          <TopInterviewersChart 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
        </div>
        
        {/* Unusual Sessions */}
        <div className="mt-6">
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
