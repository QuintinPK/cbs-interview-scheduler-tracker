import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, StopCircle, Trash2, Loader2, ChevronDown, ChevronRight, MessageCircle, MapPin } from "lucide-react";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Session, Interview, Project } from "@/types";
import InterviewsList from "./InterviewsList";
import CoordinatePopup from "../ui/CoordinatePopup";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode: (interviewerId: string) => string;
  getSessionInterviews: (sessionId: string) => Promise<Interview[]>;
  getSessionInterviewsCount: (sessionId: string) => Promise<number>;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
  projects: Project[];
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  getInterviewerCode,
  getSessionInterviews,
  getSessionInterviewsCount,
  onEdit,
  onStop,
  onDelete,
  projects
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [sessionInterviews, setSessionInterviews] = useState<Record<string, Interview[]>>({});
  const [interviewCounts, setInterviewCounts] = useState<Record<string, number>>({});
  const [loadingInterviews, setLoadingInterviews] = useState<Record<string, boolean>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const getProjectName = (projectId: string | undefined | null): string => {
    if (!projectId) return "No project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown project";
  };

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
            const count = await getSessionInterviewsCount(session.id);
            return { sessionId: session.id, count };
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
        const interviews = await getSessionInterviews(sessionId);
        setSessionInterviews({ ...sessionInterviews, [sessionId]: interviews });
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
      const interviews = await getSessionInterviews(sessionId);
      setSessionInterviews({ ...sessionInterviews, [sessionId]: interviews });
      
      setInterviewCounts({ 
        ...interviewCounts, 
        [sessionId]: interviews.length 
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Interviewer Code</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Start Date/Time</TableHead>
                <TableHead>End Date/Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Start Location</TableHead>
                <TableHead>End Location</TableHead>
                <TableHead>Interviews</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    No sessions found
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
                      <TableCell className="font-medium">{getInterviewerCode(session.interviewer_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getProjectName(session.project_id)}
                        </Badge>
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
                        {session.end_time ? calculateDuration(session.start_time, session.end_time) : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        {session.start_latitude && session.start_longitude ? (
                          <button 
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => handleCoordinateClick(session.start_latitude, session.start_longitude)}
                          >
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                          </button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {session.end_latitude && session.end_longitude ? (
                          <button 
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => handleCoordinateClick(session.end_latitude, session.end_longitude)}
                          >
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            {session.end_latitude.toFixed(4)}, {session.end_longitude.toFixed(4)}
                          </button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {loadingCounts[session.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : interviewCounts[session.id] > 0 ? (
                          <Badge 
                            variant="purple" 
                            className="flex items-center space-x-1 cursor-pointer"
                            onClick={() => toggleSessionExpanded(session.id)}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            <span>{interviewCounts[session.id]}</span>
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No interviews</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(session)}
                            title="Edit"
                            disabled={loading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {session.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onStop(session)}
                              title="Stop Session"
                              disabled={loading}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(session)}
                            title="Delete"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedSessions[session.id] && interviewCounts[session.id] > 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0 border-t-0">
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
      </div>

      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate}
      />
    </>
  );
};

export default SessionList;
