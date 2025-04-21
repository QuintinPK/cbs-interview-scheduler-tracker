
import React from "react";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Interviewer } from "@/types";

interface InterviewerQuickStatsProps {
  interviewer: Interviewer | null;
  totalTime: string;
  hasActiveSessions: boolean;
}

export const InterviewerQuickStats: React.FC<InterviewerQuickStatsProps> = ({
  interviewer,
  totalTime,
  hasActiveSessions,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Interviewer Code</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{interviewer?.code}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-cbs" />
            <p className="text-2xl font-bold">{totalTime}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${hasActiveSessions ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <p className="text-2xl font-bold">{hasActiveSessions ? 'Active' : 'Inactive'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
