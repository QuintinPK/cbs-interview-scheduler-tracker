
import React from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { formatDateTime } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Session, Interview } from "@/types";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import CoordinatePopup from "../ui/CoordinatePopup";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionHistoryProps {
  sessions: Session[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  showProject?: boolean;
  projectNameResolver?: (projectId: string) => string;
  interviews?: Interview[];
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  dateRange,
  setDateRange,
  showProject = false,
  projectNameResolver = (id) => id,
  interviews = []
}) => {
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = React.useState<{lat: number, lng: number} | null>(null);
  const [expandedSessions, setExpandedSessions] = React.useState<Record<string, boolean>>({});
  
  const handleViewLocation = (session: Session) => {
    if (session.start_latitude && session.start_longitude) {
      setSelectedCoordinate({
        lat: session.start_latitude,
        lng: session.start_longitude
      });
      setIsMapOpen(true);
    }
  };

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getSessionInterviews = (sessionId: string): Interview[] => {
    return interviews.filter(interview => interview.session_id === sessionId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Session History</h3>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>
      
      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No sessions found.</p>
      ) : (
        <div className="border rounded-md">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  {showProject && <TableHead>Project</TableHead>}
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const startTime = new Date(session.start_time);
                  const endTime = session.end_time ? new Date(session.end_time) : null;
                  const duration = endTime
                    ? Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
                    : null;
                  
                  const hours = duration ? Math.floor(duration / 60) : null;
                  const minutes = duration ? duration % 60 : null;

                  const sessionInterviews = getSessionInterviews(session.id);
                  const hasInterviews = sessionInterviews.length > 0;
                  const isExpanded = expandedSessions[session.id] || false;
                  
                  return (
                    <React.Fragment key={session.id}>
                      <TableRow className={hasInterviews ? "cursor-pointer hover:bg-muted/50" : ""}>
                        <TableCell>
                          {hasInterviews && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    onClick={() => toggleSessionExpand(session.id)} 
                                    className="p-1 rounded-full hover:bg-muted"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isExpanded ? "Hide" : "Show"} interviews ({sessionInterviews.length})</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        {showProject && (
                          <TableCell onClick={() => hasInterviews && toggleSessionExpand(session.id)}>
                            {session.project_id ? projectNameResolver(session.project_id) : "—"}
                          </TableCell>
                        )}
                        <TableCell onClick={() => hasInterviews && toggleSessionExpand(session.id)}>
                          {formatDateTime(session.start_time)}
                        </TableCell>
                        <TableCell onClick={() => hasInterviews && toggleSessionExpand(session.id)}>
                          {endTime ? formatDateTime(session.end_time as string) : "Active"}
                        </TableCell>
                        <TableCell onClick={() => hasInterviews && toggleSessionExpand(session.id)}>
                          {duration
                            ? `${hours}h ${minutes}m`
                            : "—"}
                        </TableCell>
                        <TableCell onClick={() => hasInterviews && toggleSessionExpand(session.id)}>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {session.is_active ? "Active" : "Completed"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {session.start_latitude && session.start_longitude ? (
                            <button
                              onClick={() => handleViewLocation(session)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-xs">View</span>
                            </button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>

                      {hasInterviews && (
                        <TableRow>
                          <TableCell colSpan={showProject ? 7 : 6} className="p-0 border-t-0">
                            <Collapsible open={isExpanded} onOpenChange={() => toggleSessionExpand(session.id)}>
                              <CollapsibleContent>
                                <div className="bg-muted/30 px-4 py-2">
                                  <h4 className="text-sm font-medium mb-2">Interviews in this session:</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Start Time</TableHead>
                                        <TableHead>End Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Result</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sessionInterviews.map(interview => {
                                        const intStartTime = new Date(interview.start_time);
                                        const intEndTime = interview.end_time ? new Date(interview.end_time) : null;
                                        const intDuration = intEndTime
                                          ? Math.floor((intEndTime.getTime() - intStartTime.getTime()) / (1000 * 60))
                                          : null;
                                        
                                        return (
                                          <TableRow key={interview.id}>
                                            <TableCell>{formatDateTime(interview.start_time)}</TableCell>
                                            <TableCell>
                                              {intEndTime ? formatDateTime(interview.end_time as string) : "Active"}
                                            </TableCell>
                                            <TableCell>
                                              {intDuration ? `${intDuration} min` : "—"}
                                            </TableCell>
                                            <TableCell>
                                              <HoverCard>
                                                <HoverCardTrigger>
                                                  <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                      interview.result === 'response'
                                                        ? "bg-green-100 text-green-800"
                                                        : interview.result === 'non-response'
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                                  >
                                                    {interview.result || "No result"}
                                                  </span>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80">
                                                  <div className="space-y-1">
                                                    <p className="text-sm font-medium">Interview Details</p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {interview.result === 'response' 
                                                        ? "Survey successfully completed." 
                                                        : interview.result === 'non-response'
                                                        ? "Survey could not be completed."
                                                        : "Interview status unknown."}
                                                    </p>
                                                  </div>
                                                </HoverCardContent>
                                              </HoverCard>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        coordinate={selectedCoordinate}
      />
    </div>
  );
};
