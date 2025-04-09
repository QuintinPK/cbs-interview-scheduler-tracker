
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";

interface QuickStatsCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  sessions,
  interviewers,
  loading = false
}) => {
  // Calculate stats
  const totalInterviewers = interviewers.length;
  const activeSessions = sessions.filter(session => session.is_active).length;
  
  // Get today's sessions
  const today = new Date().toISOString().split('T')[0];
  const sessionsToday = sessions.filter(session => {
    const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
    return sessionDate === today;
  }).length;
  
  // Calculate total hours this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const calculateSessionDuration = (session: Session) => {
    if (!session.end_time || session.is_active) return 0;
    
    const start = new Date(session.start_time).getTime();
    const end = new Date(session.end_time).getTime();
    
    return (end - start) / (1000 * 60 * 60); // Convert to hours
  };
  
  const thisWeekSessions = sessions.filter(session => {
    const sessionDate = new Date(session.start_time);
    return sessionDate >= startOfWeek && !session.is_active && session.end_time;
  });
  
  const totalHoursThisWeek = thisWeekSessions.reduce(
    (total, session) => total + calculateSessionDuration(session), 
    0
  );
  
  // Calculate average session length this week
  const avgSessionLength = thisWeekSessions.length > 0 
    ? totalHoursThisWeek / thisWeekSessions.length 
    : 0;
  
  // Calculate average sessions per interviewer this week
  const activeInterviewersThisWeek = new Set();
  
  sessions.filter(session => {
    const sessionDate = new Date(session.start_time);
    return sessionDate >= startOfWeek;
  }).forEach(session => {
    activeInterviewersThisWeek.add(session.interviewer_id);
  });
  
  const avgSessionsPerInterviewer = activeInterviewersThisWeek.size > 0
    ? (thisWeekSessions.length / activeInterviewersThisWeek.size).toFixed(1)
    : "0";
  
  const statsItems = [
    { label: "Total Interviewers", value: totalInterviewers },
    { label: "Active Sessions", value: activeSessions },
    { label: "Sessions Today", value: sessionsToday },
    { label: "Total Hours This Week", value: Math.round(totalHoursThisWeek) },
    { label: "Avg Session Length (h)", value: avgSessionLength.toFixed(1) },
    { label: "Avg Sessions per Interviewer", value: avgSessionsPerInterviewer }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statsItems.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-primary mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickStatsCard;
