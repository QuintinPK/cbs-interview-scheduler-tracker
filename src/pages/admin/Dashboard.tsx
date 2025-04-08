
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ActiveInterviewersCard from "@/components/admin/ActiveInterviewersCard";
import QuickStatsCard from "@/components/admin/QuickStatsCard";
import InactiveInterviewersCard from "@/components/admin/InactiveInterviewersCard";
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActiveInterviewersCard 
            sessions={sessions} 
            interviewers={interviewers} 
            loading={loading} 
          />
        </div>
        
        <div className="mt-6">
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
