
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface UnusualSessionsCardProps {
  sessions: Session[];
  interviewers: Interviewer[];
  loading?: boolean;
  threshold?: number; // in minutes
}

const UnusualSessionsCard: React.FC<UnusualSessionsCardProps> = ({
  sessions,
  interviewers,
  loading = false,
  threshold = 120 // Default: 2 hours
}) => {
  const unusualSessions = useMemo(() => {
    // Filter for completed sessions longer than the threshold
    const longSessions = sessions.filter(session => {
      if (!session.end_time || session.is_active) {
        return false;
      }
      
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      const durationMinutes = (end - start) / (1000 * 60);
      
      return durationMinutes > threshold;
    });
    
    // Sort by duration (longest first)
    return longSessions.sort((a, b) => {
      const durationA = new Date(a.end_time!).getTime() - new Date(a.start_time).getTime();
      const durationB = new Date(b.end_time!).getTime() - new Date(b.start_time).getTime();
      return durationB - durationA;
    });
  }, [sessions, threshold]);
  
  const getInterviewerCode = (interviewerId: string): string => {
    const interviewer = interviewers.find(i => i.id === interviewerId);
    return interviewer ? interviewer.code : "Unknown";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Unusual Sessions (Over {threshold} minutes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : unusualSessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No unusual sessions found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unusualSessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell>{getInterviewerCode(session.interviewer_id)}</TableCell>
                    <TableCell>{formatDateTime(session.start_time)}</TableCell>
                    <TableCell>{formatDateTime(session.end_time!)}</TableCell>
                    <TableCell>{calculateDuration(session.start_time, session.end_time!)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnusualSessionsCard;
