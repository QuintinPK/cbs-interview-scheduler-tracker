
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import SyncStatus from "@/components/session/SyncStatus";

// Basic dashboard component that renders the general layout
const DashboardContent = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Sync Status Card */}
      <div className="mb-6">
        <SyncStatus />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Sessions"
          value="0"
          description="Today's active sessions"
          icon="activity"
          trend="neutral"
          percent={0}
        />
        <StatsCard
          title="Completed Sessions"
          value="0"
          description="Today's completed sessions"
          icon="check-circle"
          trend="neutral"
          percent={0}
        />
        <StatsCard
          title="Interviews"
          value="0"
          description="Today's interviews"
          icon="users"
          trend="neutral"
          percent={0}
        />
        <StatsCard
          title="Response Rate"
          value="0%"
          description="Today's response rate"
          icon="percent"
          trend="neutral"
          percent={0}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No active projects</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
