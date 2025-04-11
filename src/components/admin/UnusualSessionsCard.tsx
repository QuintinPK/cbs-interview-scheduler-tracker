
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Session, Interviewer } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import CoordinatePopup from "../ui/CoordinatePopup";

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
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
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
  
  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };
  
  return (
    <>
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
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unusualSessions.map(session => (
                    <TableRow key={session.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Link 
                          to={`/admin/sessions`} 
                          className="font-medium hover:underline"
                        >
                          {getInterviewerCode(session.interviewer_id)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {formatDateTime(session.start_time)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {formatDateTime(session.end_time!)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/sessions`} className="hover:underline">
                          {calculateDuration(session.start_time, session.end_time!)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {session.start_latitude && session.start_longitude ? (
                          <button 
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => handleCoordinateClick(session.start_latitude, session.start_longitude)}
                          >
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            View location
                          </button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate}
      />
    </>
  );
};

export default UnusualSessionsCard;
