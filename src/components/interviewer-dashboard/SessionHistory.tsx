import React, { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { MapPin, MessageCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Session, Interview } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import InterviewsList from "../session/InterviewsList";
import { supabase } from "@/integrations/supabase/client";
import CoordinatePopup from "../ui/CoordinatePopup";

interface SessionHistoryProps {
  sessions: Session[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  dateRange,
  setDateRange,
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [sessionInterviews, setSessionInterviews] = useState<Record<string, Interview[]>>({});
  const [interviewCounts, setInterviewCounts] = useState<Record<string, number>>({});
  const [loadingInterviews, setLoadingInterviews] = useState<Record<string, boolean>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const loadAllInterviewCounts = async () => {
      const newLoadingCounts = { ...loadingCounts };
      
      for (const session of sessions) {
        if (interviewCounts[session.id] === undefined) {
          newLoadingCounts[session.id] = true;
        }
      }
      
      setLoadingCounts(newLoadingCounts);
      
      const countsPromises = sessions.map(async (session) => {
        if (interviewCounts[session.id] === undefined) {
          try {
            const { count, error } = await (supabase as any)
              .from('interviews')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);
              
            if (error) throw error;
            
            return { sessionId: session.id, count: count || 0 };
          } catch (error) {
            console.error("Error fetching interview count:", error);
            return { sessionId: session.id, count: 0 };
          }
        }
        return { sessionId: session.id, count: interviewCounts[session.id] };
      });
      
      const results = await Promise.all(countsPromises);
      
      const newCounts = { ...interviewCounts };
      results.forEach(({ sessionId, count }) => {
        newCounts[sessionId] = count;
        newLoadingCounts[sessionId] = false;
      });
      
      setInterviewCounts(newCounts);
      setLoadingCounts(newLoadingCounts);
    };
    
    if (sessions.length > 0) {
      loadAllInterviewCounts();
    }
  }, [sessions]);

  const toggleSessionExpanded = async (sessionId: string) => {
    const newExpandedSessions = { ...expandedSessions };
    newExpandedSessions[sessionId] = !expandedSessions[sessionId];
    setExpandedSessions(newExpandedSessions);

    if (newExpandedSessions[sessionId] && !sessionInterviews[sessionId]) {
      setLoadingInterviews({ ...loadingInterviews, [sessionId]: true });
      try {
        const { data, error } = await (supabase as any)
          .from('interviews')
          .select('*')
          .eq('session_id', sessionId)
          .order('start_time', { ascending: false });
          
        if (error) throw error;
        
        setSessionInterviews({ ...sessionInterviews, [sessionId]: data || [] });
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoadingInterviews({ ...loadingInterviews, [sessionId]: false });
      }
    }
  };

  const refreshInterviews = async (sessionId: string) => {
    if (!sessionInterviews[sessionId]) return;
    
    setLoadingInterviews({ ...loadingInterviews, [sessionId]: true });
    try {
      const { data, error } = await (supabase as any)
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      setSessionInterviews({ ...sessionInterviews, [sessionId]: data || [] });
      
      setInterviewCounts({ 
        ...interviewCounts, 
        [sessionId]: (data || []).length 
      });
    } catch (error) {
      console.error("Error refreshing interviews:", error);
    } finally {
      setLoadingInterviews({ ...loadingInterviews, [sessionId]: false });
    }
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
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <CardTitle>Session History</CardTitle>
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Interviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No sessions recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <React.Fragment key={session.id}>
                      <TableRow className={expandedSessions[session.id] ? "bg-gray-50" : ""}>
                        <TableCell>
                          {interviewCounts[session.id] > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSessionExpanded(session.id)}
                            >
                              {expandedSessions[session.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(session.start_time)}</TableCell>
                        <TableCell>
                          {session.end_time ? formatDateTime(session.end_time) : (
                            <Badge variant="warning">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.end_time 
                            ? calculateDuration(session.start_time, session.end_time)
                            : 'Ongoing'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${session.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {session.is_active ? 'Active' : 'Completed'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.start_latitude && session.start_longitude ? (
                            <button 
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => handleCoordinateClick(session.start_latitude, session.start_longitude)}
                            >
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                            </button>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {loadingCounts[session.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : interviewCounts[session.id] > 0 ? (
                            <Badge 
                              variant="purple" 
                              className="flex items-center cursor-pointer"
                              onClick={() => toggleSessionExpanded(session.id)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              <span>{interviewCounts[session.id]}</span>
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">No interviews</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedSessions[session.id] && interviewCounts[session.id] > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0 border-t-0">
                            <div className="bg-gray-50 pl-12 pr-4 py-4">
                              {loadingInterviews[session.id] ? (
                                <div className="flex justify-center items-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-cbs" />
                                  <span className="ml-2 text-gray-500">Loading interviews...</span>
                                </div>
                              ) : sessionInterviews[session.id]?.length ? (
                                <InterviewsList 
                                  interviews={sessionInterviews[session.id]} 
                                  refreshInterviews={() => refreshInterviews(session.id)}
                                />
                              ) : (
                                <p className="text-gray-500 text-center py-4">No interviews for this session</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
