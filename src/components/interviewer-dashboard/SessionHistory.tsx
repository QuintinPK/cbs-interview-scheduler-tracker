
import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { Session, Interview } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateDuration, formatDateTime, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Loader2, MapPin, MessageCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import CoordinatePopup from '../ui/CoordinatePopup';
import { useSessionSorting } from '@/hooks/useSessionSorting';

interface SessionHistoryProps {
  sessions: Session[];
  interviews: Interview[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  showProject: boolean;
  projectNameResolver: (id: string) => string;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  interviews,
  dateRange,
  setDateRange,
  showProject,
  projectNameResolver
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const getInterviewerCode = (id: string) => id; // This is just a placeholder as we're in the interviewer's context
  
  const {
    sortedSessions,
    sortField,
    sortDirection,
    toggleSort
  } = useSessionSorting(sessions, getInterviewerCode, projectNameResolver);

  const SortableHeader: React.FC<{
    field: 'interviewer_code' | 'project' | 'duration' | 'start_time' | 'end_time';
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <Button
      variant="ghost"
      className={cn(
        "h-8 flex items-center gap-1 -ml-2 font-medium",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200",
        "group"
      )}
      onClick={() => toggleSort(field)}
    >
      <span className="group-hover:text-primary">{children}</span>
      <div className="w-4">
        {sortField === field ? (
          sortDirection === 'asc' ? 
            <ArrowUp className="h-3 w-3 text-primary" /> : 
            <ArrowDown className="h-3 w-3 text-primary" />
        ) : (
          <div className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowUp className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </Button>
  );

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getInterviewsCountForSession = (sessionId: string) => {
    return interviews.filter(interview => interview.session_id === sessionId).length;
  };

  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };

  const sessionInterviewsMap = interviews.reduce((acc, interview) => {
    if (!acc[interview.session_id]) {
      acc[interview.session_id] = [];
    }
    acc[interview.session_id].push(interview);
    return acc;
  }, {} as Record<string, Interview[]>);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-semibold">Session History</h3>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>All time</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
            {dateRange?.from && (
              <div className="p-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                  Reset date filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                {showProject && (
                  <TableHead>
                    <SortableHeader field="project">Project</SortableHeader>
                  </TableHead>
                )}
                <TableHead>
                  <SortableHeader field="start_time">Start Date/Time</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="end_time">End Date/Time</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="duration">Duration</SortableHeader>
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
                          <Badge variant="outline">{projectNameResolver(session.project_id || '')}</Badge>
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
                      <TableRow>
                        <TableCell colSpan={showProject ? 8 : 7} className="p-0 border-t-0">
                          <div className="bg-gray-50 pl-12 pr-4 py-4">
                            <div className="space-y-2">
                              {sessionInterviewsMap[session.id]?.map((interview) => (
                                <div key={interview.id} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium">
                                          {format(parseISO(interview.start_time), "MMM d, yyyy • h:mm a")}
                                        </span>
                                        {interview.result && (
                                          <Badge variant={interview.result === 'response' ? 'success' : 'destructive'}>
                                            {interview.result === 'response' ? 'Response' : 'Non-response'}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Duration: {interview.end_time 
                                          ? calculateDuration(interview.start_time, interview.end_time) 
                                          : "Ongoing"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
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
    </div>
  );
};

export default SessionHistory;
