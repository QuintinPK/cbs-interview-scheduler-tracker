
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, StopCircle, Trash2, Loader2, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Session, Interview } from "@/types";
import InterviewsList from "./InterviewsList";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode: (interviewerId: string) => string;
  getSessionInterviews: (sessionId: string) => Promise<Interview[]>;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  getInterviewerCode,
  getSessionInterviews,
  onEdit,
  onStop,
  onDelete
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [sessionInterviews, setSessionInterviews] = useState<Record<string, Interview[]>>({});
  const [loadingInterviews, setLoadingInterviews] = useState<Record<string, boolean>>({});

  const toggleSessionExpanded = async (sessionId: string) => {
    const newExpandedSessions = { ...expandedSessions };
    newExpandedSessions[sessionId] = !expandedSessions[sessionId];
    setExpandedSessions(newExpandedSessions);

    // If expanding and we don't have the interviews yet, fetch them
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

  const getInterviewsCount = (sessionId: string) => {
    if (sessionInterviews[sessionId]) {
      return sessionInterviews[sessionId].length;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Interviewer Code</TableHead>
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
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                  </div>
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <React.Fragment key={session.id}>
                  <TableRow className={expandedSessions[session.id] ? "bg-gray-50" : ""}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="font-medium">{getInterviewerCode(session.interviewer_id)}</TableCell>
                    <TableCell>{formatDateTime(session.start_time)}</TableCell>
                    <TableCell>
                      {session.end_time ? formatDateTime(session.end_time) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.end_time ? calculateDuration(session.start_time, session.end_time) : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      {session.start_latitude && session.start_longitude ? (
                        <span className="text-xs">
                          {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {session.end_latitude && session.end_longitude ? (
                        <span className="text-xs">
                          {session.end_latitude.toFixed(4)}, {session.end_longitude.toFixed(4)}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        <span>{
                          expandedSessions[session.id] && sessionInterviews[session.id] 
                            ? getInterviewsCount(session.id) 
                            : "..."
                        }</span>
                      </div>
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
                  {expandedSessions[session.id] && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0 border-t-0">
                        <div className="bg-gray-50 pl-12 pr-4 py-4">
                          {loadingInterviews[session.id] ? (
                            <div className="flex justify-center items-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-cbs" />
                              <span className="ml-2 text-gray-500">Loading interviews...</span>
                            </div>
                          ) : sessionInterviews[session.id]?.length ? (
                            <InterviewsList interviews={sessionInterviews[session.id]} />
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
  );
};

export default SessionList;
