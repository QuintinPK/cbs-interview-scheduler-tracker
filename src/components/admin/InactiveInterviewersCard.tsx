
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { UserX } from "lucide-react";

interface InactiveInterviewersCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
}

const InactiveInterviewersCard: React.FC<InactiveInterviewersCardProps> = ({
  sessions,
  interviewers,
  loading = false
}) => {
  // Calculate start of this week (Sunday)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Find active interviewer IDs this week
  const activeInterviewerIds = new Set(
    sessions
      .filter(session => new Date(session.start_time) >= startOfWeek)
      .map(session => session.interviewer_id)
  );
  
  // Get interviewers who haven't been active this week
  const inactiveInterviewers = interviewers.filter(
    interviewer => !activeInterviewerIds.has(interviewer.id)
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <UserX className="h-5 w-5 mr-2 text-amber-500" />
          <span>Interviewers Inactive This Week</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : inactiveInterviewers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">All interviewers have been active this week</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inactiveInterviewers.map((interviewer) => (
              <div key={interviewer.id} className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{interviewer.code}</p>
                <p className="text-sm text-muted-foreground">
                  {interviewer.first_name} {interviewer.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {interviewer.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InactiveInterviewersCard;
