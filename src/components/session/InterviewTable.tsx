
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Interview } from "@/types";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { LocationDisplay } from "@/components/session/LocationDisplay";

interface InterviewTableProps {
  interviews: Interview[];
  onEditClick: (interview: Interview) => void;
  onDeleteClick: (interview: Interview) => void;
  handleCoordinateClick: (lat: number | null, lng: number | null) => void;
  getResultBadge: (result: string | null) => React.ReactNode;
}

export const InterviewTable: React.FC<InterviewTableProps> = ({
  interviews,
  onEditClick,
  onDeleteClick,
  handleCoordinateClick,
  getResultBadge
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-1/6">Start Time</TableHead>
          <TableHead className="w-1/6">End Time</TableHead>
          <TableHead className="w-1/6">Duration</TableHead>
          <TableHead className="w-1/6">Start Location</TableHead>
          <TableHead className="w-1/6">End Location</TableHead>
          <TableHead className="w-1/8">Result</TableHead>
          <TableHead className="w-1/12">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interviews.map((interview) => (
          <TableRow key={interview.id} className="hover:bg-gray-100">
            <TableCell>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-gray-500" />
                {formatDateTime(interview.start_time)}
              </div>
            </TableCell>
            <TableCell>
              {interview.end_time ? (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-gray-500" />
                  {formatDateTime(interview.end_time)}
                </div>
              ) : (
                <Badge variant="warning">
                  Active
                </Badge>
              )}
            </TableCell>
            <TableCell>
              {interview.end_time ? calculateDuration(interview.start_time, interview.end_time) : "Ongoing"}
            </TableCell>
            <TableCell>
              <LocationDisplay 
                latitude={interview.start_latitude}
                longitude={interview.start_longitude}
                onLocationClick={handleCoordinateClick}
              />
            </TableCell>
            <TableCell>
              <LocationDisplay 
                latitude={interview.end_latitude}
                longitude={interview.end_longitude}
                onLocationClick={handleCoordinateClick}
              />
            </TableCell>
            <TableCell>
              {interview.is_active ? (
                <Badge variant="warning">Active</Badge>
              ) : (
                getResultBadge(interview.result)
              )}
            </TableCell>
            <TableCell>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditClick(interview)}
                  disabled={interview.is_active}
                  className="h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteClick(interview)}
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InterviewTable;
