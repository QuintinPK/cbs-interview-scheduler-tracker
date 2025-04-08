
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ActiveInterviewersCard from "@/components/admin/ActiveInterviewersCard";
import RecentlyActiveCard from "@/components/admin/RecentlyActiveCard";
import { mockSessions } from "@/lib/mock-data";

const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActiveInterviewersCard sessions={mockSessions} />
          <RecentlyActiveCard sessions={mockSessions} />
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Interviewers</p>
              <p className="text-2xl font-bold text-cbs">4</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Active Sessions</p>
              <p className="text-2xl font-bold text-cbs">1</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Sessions Today</p>
              <p className="text-2xl font-bold text-cbs">2</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Hours This Week</p>
              <p className="text-2xl font-bold text-cbs">42</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
