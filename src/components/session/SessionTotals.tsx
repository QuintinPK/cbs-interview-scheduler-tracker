
import React from "react";
import { Session } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";

export interface SessionTotalsProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode?: (id: string) => string;
}

const SessionTotals: React.FC<SessionTotalsProps> = ({ 
  sessions, 
  loading,
  getInterviewerCode 
}) => {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(session => session.is_active).length;
  const completedSessions = totalSessions - activeSessions;

  const totalDurationMilliseconds = sessions.reduce((acc, session) => {
    if (session.end_time) {
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      return acc + (end - start);
    }
    return acc;
  }, 0);

  const averageDuration = totalSessions > 0 && completedSessions > 0 
    ? totalDurationMilliseconds / completedSessions 
    : 0;
  
  // Calculate hours and minutes for average duration
  const avgHours = Math.floor(averageDuration / (1000 * 60 * 60));
  const avgMinutes = Math.floor((averageDuration % (1000 * 60 * 60)) / (1000 * 60));
  const formattedAverageDuration = `${avgHours}h ${avgMinutes}m`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-4 w-[100px]" /> : totalSessions}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-4 w-[100px]" /> : activeSessions}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Session Duration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-4 w-[100px]" /> : formattedAverageDuration}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionTotals;
