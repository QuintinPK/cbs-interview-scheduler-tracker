
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Session, Interview } from "@/types";
import { differenceInWeeks, startOfWeek, endOfWeek } from "date-fns";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';
import { Bar } from 'recharts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceMetricsProps {
  sessions: Session[];
  interviews: Interview[];
  allInterviewersSessions?: Session[];
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  sessions,
  interviews,
  allInterviewersSessions = []
}) => {
  // Calculate weekly averages
  const calculateWeeklyAverage = (sessions: Session[]) => {
    if (sessions.length === 0) return 0;
    
    const totalMinutes = sessions.reduce((acc, session) => {
      if (session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0);
    
    const firstSession = new Date(sessions[0].start_time);
    const lastSession = new Date(sessions[sessions.length - 1].start_time);
    const weeks = Math.max(1, differenceInWeeks(lastSession, firstSession));
    
    return totalMinutes / weeks / 60; // Convert to hours
  };
  
  const weeklyAverage = calculateWeeklyAverage(sessions);
  const allInterviewersWeeklyAverage = calculateWeeklyAverage(allInterviewersSessions);
  
  // Calculate average time per interview type
  const calculateAverageTimePerType = () => {
    const responseInterviews = interviews.filter(i => i.result === 'response' && i.end_time);
    const nonResponseInterviews = interviews.filter(i => i.result === 'non-response' && i.end_time);
    
    const calcAverage = (interviews: Interview[]) => {
      if (interviews.length === 0) return 0;
      const totalMinutes = interviews.reduce((acc, interview) => {
        const start = new Date(interview.start_time);
        const end = new Date(interview.end_time!);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
      return totalMinutes / interviews.length;
    };
    
    return {
      response: calcAverage(responseInterviews),
      nonResponse: calcAverage(nonResponseInterviews)
    };
  };
  
  const averageTimePerType = calculateAverageTimePerType();
  
  // Calculate completion rate
  const completionRate = interviews.length > 0 
    ? (interviews.filter(i => i.result === 'response').length / interviews.length) * 100 
    : 0;
    
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Your Weekly Average</p>
              <p className="text-2xl font-bold">{weeklyAverage.toFixed(1)}h</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">All Interviewers Average</p>
              <p className="text-2xl font-bold">{allInterviewersWeeklyAverage.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">
                {weeklyAverage > allInterviewersWeeklyAverage ? 
                  `+${((weeklyAverage / allInterviewersWeeklyAverage - 1) * 100).toFixed(1)}% above average` :
                  `${((1 - weeklyAverage / allInterviewersWeeklyAverage) * 100).toFixed(1)}% below average`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Interview Duration Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Average Time per Response</p>
              <p className="text-2xl font-bold">{averageTimePerType.response.toFixed(1)} minutes</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Average Time per Non-Response</p>
              <p className="text-2xl font-bold">{averageTimePerType.nonResponse.toFixed(1)} minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold">{interviews.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
