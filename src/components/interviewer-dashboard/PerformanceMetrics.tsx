
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Interview, Interviewer, Session } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PerformanceMetricsProps {
  sessions: Session[];
  interviews: Interview[];
  interviewer: Interviewer;
  allInterviewersSessions: Session[];
  interviewers: Interviewer[];
  onCompare: (interviewerId: string) => void;
}

export const PerformanceMetrics = ({
  sessions,
  interviews,
  interviewer,
  allInterviewersSessions,
  interviewers,
  onCompare
}: PerformanceMetricsProps) => {
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");
  
  // Reset the selected interviewer when the current interviewer changes
  useEffect(() => {
    setSelectedInterviewerId("");
  }, [interviewer.id]);
  
  // Calculate basic statistics
  const totalSessions = sessions.length;
  const totalInterviews = interviews.length;
  const averageSessionsPerDay = totalSessions > 0 ? (totalSessions / 30).toFixed(1) : "0";
  
  // Calculate response rate if we have interview data
  const responseRate = totalInterviews > 0 
    ? (interviews.filter(i => i.result === 'response').length / totalInterviews * 100).toFixed(1) 
    : "N/A";
  
  // Get the list of other interviewers for comparison
  const otherInterviewers = interviewers.filter(i => i.id !== interviewer.id);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Avg. Sessions per Day</p>
              <p className="text-2xl font-bold">{averageSessionsPerDay}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold">{totalInterviews}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{responseRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compare Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <Select
                value={selectedInterviewerId}
                onValueChange={setSelectedInterviewerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an interviewer to compare with" />
                </SelectTrigger>
                <SelectContent>
                  {otherInterviewers.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.first_name} {i.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => selectedInterviewerId && onCompare(selectedInterviewerId)}
              disabled={!selectedInterviewerId}
            >
              Compare
            </Button>
          </div>
          
          {selectedInterviewerId && (
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="text-sm">
                Click the Compare button to view a detailed side-by-side comparison with 
                {otherInterviewers.find(i => i.id === selectedInterviewerId)?.first_name} 
                {' '}
                {otherInterviewers.find(i => i.id === selectedInterviewerId)?.last_name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
