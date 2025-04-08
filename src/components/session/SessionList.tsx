
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, StopCircle, Trash2, Loader2 } from "lucide-react";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Session } from "@/types";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  getInterviewerCode: (interviewerId: string) => string;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  getInterviewerCode,
  onEdit,
  onStop,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Interviewer Code</TableHead>
              <TableHead>Start Date/Time</TableHead>
              <TableHead>End Date/Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Location</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                  </div>
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SessionList;
