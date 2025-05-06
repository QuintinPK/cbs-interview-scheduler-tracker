
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDateTime } from "@/lib/utils";
import { Session } from "@/types";
import { SessionActions } from "./SessionActions";
import { LocationDisplay } from "./LocationDisplay";
import { SessionInterviewsCount } from "./SessionInterviewsCount";

interface SessionRowProps {
  session: Session;
  isExpanded: boolean;
  interviewCount: number;
  loadingCount: boolean;
  getInterviewerCode: (interviewerId: string) => string;
  getProjectName: (projectId: string | null | undefined) => string;
  calculateDuration: (startTime: string, endTime: string | null) => string;
  toggleSessionExpanded: (sessionId: string) => void;
  handleCoordinateClick: (lat: number | null, lng: number | null) => void;
  onEdit: (session: Session) => void;
  onStop: (session: Session) => void;
  onDelete: (session: Session) => void;
  loading: boolean;
}

export const SessionRow: React.FC<SessionRowProps> = ({
  session,
  isExpanded,
  interviewCount,
  loadingCount,
  getInterviewerCode,
  getProjectName,
  calculateDuration,
  toggleSessionExpanded,
  handleCoordinateClick,
  onEdit,
  onStop,
  onDelete,
  loading,
}) => {
  return (
    <TableRow className={isExpanded ? "bg-gray-50" : ""}>
      <TableCell>
        {interviewCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSessionExpanded(session.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </TableCell>
      <TableCell className="font-medium">
        <Link 
          to={`/admin/interviewer/${session.interviewer_id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {getInterviewerCode(session.interviewer_id)}
        </Link>
      </TableCell>
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
        {calculateDuration(session.start_time, session.end_time)}
      </TableCell>
      <TableCell>
        <LocationDisplay 
          latitude={session.start_latitude} 
          longitude={session.start_longitude}
          onLocationClick={handleCoordinateClick}
        />
      </TableCell>
      <TableCell>
        <LocationDisplay 
          latitude={session.end_latitude} 
          longitude={session.end_longitude}
          onLocationClick={handleCoordinateClick}
        />
      </TableCell>
      <TableCell>
        <SessionInterviewsCount 
          count={interviewCount} 
          isLoading={loadingCount}
          onToggleExpanded={() => toggleSessionExpanded(session.id)}
        />
      </TableCell>
      <TableCell>
        <SessionActions 
          session={session}
          loading={loading}
          onEdit={onEdit}
          onStop={onStop}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
