
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface InterviewerQuickStatsProps {
  interviewer: {
    first_name: string;
    last_name: string;
  };
  totalTime: string;
  hasActiveSessions: boolean;
  projectMetrics?: {
    sessionCount: number;
    totalTime: string;
    averageSessionLength: number;
  } | null;
}

export const InterviewerQuickStats: React.FC<InterviewerQuickStatsProps> = ({
  interviewer,
  totalTime,
  hasActiveSessions,
  projectMetrics
}) => {
  return (
    <Card>
      <CardContent className="grid gap-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Time</p>
              <p className="text-xl font-bold">{totalTime}</p>
            </div>
          </div>
          
          {projectMetrics && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Project Sessions</p>
                  <p className="text-xl font-bold">{projectMetrics.sessionCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Project Time</p>
                  <p className="text-xl font-bold">{projectMetrics.totalTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Avg. Project Session</p>
                  <p className="text-xl font-bold">{projectMetrics.averageSessionLength} min</p>
                </div>
              </div>
            </>
          )}
          
          {hasActiveSessions && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xl font-bold">Active</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
