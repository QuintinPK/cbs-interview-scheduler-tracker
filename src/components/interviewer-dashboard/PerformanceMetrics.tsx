
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Session, Interview, Interviewer } from "@/types";
import { differenceInWeeks, startOfWeek, endOfWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useInterviewers } from "@/hooks/useInterviewers";
import { Button } from "@/components/ui/button";

interface PerformanceMetricsProps {
  sessions: Session[];
  interviews: Interview[];
  interviewer?: Interviewer;
  allInterviewersSessions?: Session[];
  onCompare?: (interviewerId: string) => void;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  sessions,
  interviews,
  interviewer,
  allInterviewersSessions = [],
  onCompare
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { projects } = useProjects();
  const { interviewers } = useInterviewers();

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(project => {
      map.set(project.id, project.name);
    });
    return map;
  }, [projects]);

  const projectIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach(session => {
      if (session.project_id) ids.add(session.project_id);
    });
    return Array.from(ids);
  }, [sessions]);

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

  // Get comparable interviewers (same island and project)
  const comparableInterviewers = useMemo(() => {
    if (!interviewer) return [];
    
    return interviewers.filter(i => 
      i.id !== interviewer.id && 
      i.island === interviewer.island &&
      (selectedProject === "all" || sessions.some(s => s.project_id === selectedProject))
    );
  }, [interviewers, interviewer, selectedProject, sessions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-md shadow-md p-3">
          <p className="font-medium text-sm">{`${label} Interviews`}</p>
          <p className="text-primary text-sm">{`Average Duration: ${payload[0].value.toFixed(1)} minutes`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-64">
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
                <SelectItem key={id} value={id}>{projectMap.get(id) || id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {interviewer && comparableInterviewers.length > 0 && onCompare && (
          <div className="flex gap-2 items-center">
            <p className="text-sm text-muted-foreground">Compare with:</p>
            <Select onValueChange={onCompare}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select interviewer" />
              </SelectTrigger>
              <SelectContent>
                {comparableInterviewers.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name} ({i.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Performance</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground/70" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">This metric shows the average hours worked per week over all of the interviewer's sessions. A higher weekly average indicates greater productivity and availability, and you can compare against the all-interviewers average to see how this interviewer ranks among peers.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
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
          <div className="flex items-center justify-between">
            <CardTitle>Interview Duration Analysis</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground/70" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">This chart shows how much time the interviewer typically spends on different types of interviews. Response interviews are those where the interviewer successfully completes the survey, while non-response interviews are unsuccessful attempts. Ideally, non-response interviews should be shorter than response interviews to maximize efficiency.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="minutes" 
                  name="Average Duration (minutes)" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Additional Metrics</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground/70" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">The response rate indicates how successful the interviewer is at completing surveys. A higher response rate (closer to 100%) suggests the interviewer is more effective at engaging participants and obtaining completed surveys. The total interviews count shows overall activity level.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
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
