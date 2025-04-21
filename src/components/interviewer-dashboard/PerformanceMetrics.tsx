import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Session, Interview } from "@/types";
import { differenceInWeeks, startOfWeek, endOfWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const filteredSessions = useMemo(() => {
    if (selectedProject === "all") return sessions;
    return sessions.filter(session => session.project_id === selectedProject);
  }, [sessions, selectedProject]);

  const filteredInterviews = useMemo(() => {
    if (selectedProject === "all") return interviews;
    return interviews.filter(interview => interview.project_id === selectedProject);
  }, [interviews, selectedProject]);

  const filteredAllInterviewersSessions = useMemo(() => {
    if (selectedProject === "all") return allInterviewersSessions;
    return allInterviewersSessions.filter(session => session.project_id === selectedProject);
  }, [allInterviewersSessions, selectedProject]);

  const projectIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach(session => {
      if (session.project_id) ids.add(session.project_id);
    });
    return Array.from(ids);
  }, [sessions]);

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

  const weeklyAverage = calculateWeeklyAverage(filteredSessions);
  const allInterviewersWeeklyAverage = calculateWeeklyAverage(filteredAllInterviewersSessions);

  const calculateAverageTimePerType = () => {
    const responseInterviews = filteredInterviews.filter(i => i.result === 'response' && i.end_time);
    const nonResponseInterviews = filteredInterviews.filter(i => i.result === 'non-response' && i.end_time);
    
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

  const completionRate = filteredInterviews.length > 0 
    ? (filteredInterviews.filter(i => i.result === 'response').length / filteredInterviews.length) * 100 
    : 0;

  const interviewDurationData = [
    {
      name: 'Response',
      minutes: averageTimePerType.response,
    },
    {
      name: 'Non-Response',
      minutes: averageTimePerType.nonResponse,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="w-64 mb-4">
        <Select 
          value={selectedProject}
          onValueChange={setSelectedProject}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectIds.map(id => (
              <SelectItem key={id} value={id}>{id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interviewDurationData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="minutes" name="Average Duration (minutes)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
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
              <p className="text-2xl font-bold">{filteredInterviews.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
