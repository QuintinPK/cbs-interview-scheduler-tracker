
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@/types";
import { formatTime } from "@/lib/utils";

interface RecentlyActiveCardProps {
  sessions: Session[];
}

const RecentlyActiveCard: React.FC<RecentlyActiveCardProps> = ({ sessions }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    return sessionDate === today;
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Active Interviewers</CardTitle>
      </CardHeader>
      <CardContent>
        {todaySessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No interviewers active today</p>
        ) : (
          <div className="space-y-4">
            {todaySessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">{session.interviewerCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.isActive 
                      ? `Started at ${formatTime(session.startTime)}`
                      : `${formatTime(session.startTime)} - ${formatTime(session.endTime!)}`
                    }
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  session.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {session.isActive ? "Active" : "Completed"}
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
