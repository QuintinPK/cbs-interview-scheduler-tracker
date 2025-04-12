import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { Session } from "@/types";
import { calculateDuration } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface SessionTotalsProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode?: (interviewerId: string) => string;
}

interface GroupedSession {
  interviewerId: string;
  totalSeconds: number;
  sessionCount: number;
}

const SessionTotals: React.FC<SessionTotalsProps> = ({ 
  sessions, 
  loading, 
  getInterviewerCode = () => "Unknown" 
}) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [groupedSessions, setGroupedSessions] = useState<Record<string, GroupedSession>>({});
  
  useEffect(() => {
    if (loading || sessions.length === 0) return;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (activeTab) {
      case "daily":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "weekly":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "monthly":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }
    
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    const grouped: Record<string, GroupedSession> = {};
    
    filteredSessions.forEach(session => {
      const interviewerId = session.interviewer_id;
      
      if (!grouped[interviewerId]) {
        grouped[interviewerId] = {
          interviewerId,
          totalSeconds: 0,
          sessionCount: 0
        };
      }
      
      if (session.end_time) {
        const startTime = new Date(session.start_time);
        const endTime = new Date(session.end_time);
        const durationInSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
        grouped[interviewerId].totalSeconds += durationInSeconds;
      }
      
      grouped[interviewerId].sessionCount++;
    });
    
    setGroupedSessions(grouped);
  }, [sessions, activeTab, loading]);
  
  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  const getTotalsTitle = () => {
    switch (activeTab) {
      case "daily":
        return `Today (${format(new Date(), 'MMM d, yyyy')})`;
      case "weekly":
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return `This Week (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`;
      case "monthly":
        return `This Month (${format(new Date(), 'MMMM yyyy')})`;
      default:
        return "Totals";
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Session Totals</CardTitle>
        <CardDescription>{getTotalsTitle()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-cbs" />
              </div>
            ) : Object.keys(groupedSessions).length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No sessions found for this period</p>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedSessions).map(group => (
                  <div key={group.interviewerId} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{getInterviewerCode(group.interviewerId)}</p>
                      <p className="text-sm text-muted-foreground">{group.sessionCount} session(s)</p>
                    </div>
                    <div className="font-bold">{formatTotalTime(group.totalSeconds)}</div>
                  </div>
                ))}
                
                <div className="flex justify-between p-3 bg-cbs/10 rounded-lg mt-4">
                  <p className="font-bold">Total</p>
                  <p className="font-bold">
                    {formatTotalTime(
                      Object.values(groupedSessions).reduce((total, group) => total + group.totalSeconds, 0)
                    )}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SessionTotals;
