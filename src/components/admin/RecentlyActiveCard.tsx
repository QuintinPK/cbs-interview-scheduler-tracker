
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { formatTime } from "@/lib/utils";

interface RecentlyActiveCardProps {
  sessions: Session[];
  interviewers?: Interviewer[];
  loading?: boolean;
}

const RecentlyActiveCard: React.FC<RecentlyActiveCardProps> = ({ 
  sessions, 
  interviewers = [],
  loading = false
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
    return sessionDate === today;
  });
  
  // Get interviewer code from ID
  const getInterviewerCode = (interviewerId: string) => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : 'Unknown';
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Active Interviewers</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : todaySessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No interviewers active today</p>
        ) : (
          <div className="space-y-4">
            {todaySessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">{getInterviewerCode(session.interviewer_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.is_active 
                      ? `Started at ${formatTime(session.start_time)}`
                      : `${formatTime(session.start_time)} - ${formatTime(session.end_time!)}`
                    }
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  session.is_active 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {session.is_active ? "Active" : "Completed"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentlyActiveCard;
