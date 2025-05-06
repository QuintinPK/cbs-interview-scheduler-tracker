
import React from 'react';
import { Session, Interview } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateTime, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, MapPin, MessageCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useSessionSorting } from '@/hooks/useSessionSorting';
import { SortableHeader } from './SortableHeader';
import { InterviewsList } from './InterviewsList';
import { calculateDuration } from '@/utils/sessionUtils';

interface SessionTableProps {
  sessions: Session[];
  interviews: Interview[];
  expandedSessions: Record<string, boolean>;
  toggleSessionExpanded: (sessionId: string) => void;
  handleCoordinateClick: (lat: number | null, lng: number | null) => void;
  showProject: boolean;
  getProjectName: (id: string | undefined | null) => string;
  getInterviewerCode: (id: string) => string;
}

export const SessionTable: React.FC<SessionTableProps> = ({
  sessions,
  interviews,
  expandedSessions,
  toggleSessionExpanded,
  handleCoordinateClick,
  showProject,
  getProjectName,
  getInterviewerCode
}) => {
  const {
    sortedSessions,
    sortField,
    sortDirection,
    toggleSort
  } = useSessionSorting(sessions, getInterviewerCode, getProjectName);
  
  const getInterviewsCountForSession = (sessionId: string) => {
    return interviews.filter(interview => interview.session_id === sessionId).length;
  };

  // Group interviews by session
  const sessionInterviewsMap = interviews.reduce((acc, interview) => {
    if (!acc[interview.session_id]) {
      acc[interview.session_id] = [];
    }
    acc[interview.session_id].push(interview);
    return acc;
  }, {} as Record<string, Interview[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              {showProject && (
                <TableHead>
                  <SortableHeader 
                    field="project" 
                    sortField={sortField} 
                    sortDirection={sortDirection} 
                    toggleSort={toggleSort}
                  >
                    Project
                  </SortableHeader>
                </TableHead>
              )}
              <TableHead>
                <SortableHeader 
                  field="start_time" 
                  sortField={sortField} 
                  sortDirection={sortDirection} 
                  toggleSort={toggleSort}
                >
                  Start Date/Time
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader 
                  field="end_time" 
                  sortField={sortField} 
                  sortDirection={sortDirection} 
                  toggleSort={toggleSort}
                >
                  End Date/Time
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader 
                  field="duration" 
                  sortField={sortField} 
                  sortDirection={sortDirection} 
                  toggleSort={toggleSort}
                >
                  Duration
                </SortableHeader>
              </TableHead>
              <TableHead>Start Location</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead>Interviews</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showProject ? 8 : 7} className="text-center py-6 text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sortedSessions.map((session) => (
                <React.Fragment key={session.id}>
                  <TableRow className={expandedSessions[session.id] ? "bg-gray-50" : ""}>
                    <TableCell>
                      {getInterviewsCountForSession(session.id) > 0 && (
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
                    {showProject && (
                      <TableCell>
                        <Badge variant="outline">{getProjectName(session.project_id || '')}</Badge>
                      </TableCell>
                    )}
                    <TableCell>{formatDateTime(session.start_time)}</TableCell>
                    <TableCell>
                      {session.end_time ? formatDateTime(session.end_time) : (
                        <Badge variant="warning">Active</Badge>
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
                      {getInterviewsCountForSession(session.id) > 0 ? (
                        <Badge 
                          variant="purple" 
                          className="flex items-center space-x-1 cursor-pointer"
                          onClick={() => toggleSessionExpanded(session.id)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span>{getInterviewsCountForSession(session.id)}</span>
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No interviews</span>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {expandedSessions[session.id] && getInterviewsCountForSession(session.id) > 0 && (
                    <InterviewsList 
                      interviews={sessionInterviewsMap[session.id] || []}
                      showProject={showProject}
                    />
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
