
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface QuickStatsCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
  /** Optional override for total interviewers to reflect project+island filter */
  totalInterviewersOverride?: number;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  sessions,
  interviewers,
  loading = false,
  totalInterviewersOverride
}) => {
  // Use the override (from Dashboard, if project filter is active), otherwise default to all interviewers
  const totalInterviewers = typeof totalInterviewersOverride === "number"
    ? totalInterviewersOverride
    : interviewers.length;

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
    
  // Calculate sessions per week (new metric)
  const sessionsPerWeek = thisWeekSessions.length;
  
  const statsItems = [
    { 
      label: "Total Interviewers", 
      value: totalInterviewers,
      tooltip: "The total number of interviewers available for the selected filters" 
    },
    { 
      label: "Active Sessions", 
      value: activeSessions,
      tooltip: "Sessions that are currently active (not completed)" 
    },
    { 
      label: "Sessions Today", 
      value: sessionsToday,
      tooltip: "Total sessions started today" 
    },
    { 
      label: "Total Hours This Week", 
      value: Math.round(totalHoursThisWeek),
      tooltip: "Total hours of completed sessions this week" 
    },
    { 
      label: "Sessions This Week", 
      value: sessionsPerWeek,
      tooltip: "Total sessions started this week" 
    },
    { 
      label: "Avg Sessions per Interviewer", 
      value: avgSessionsPerInterviewer,
      tooltip: "Average number of sessions per active interviewer this week" 
    }
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statsItems.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickStatsCard;
