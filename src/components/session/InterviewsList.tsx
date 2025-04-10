
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatDateTime, calculateDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/types";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";

interface InterviewsListProps {
  interviews: Interview[];
}

const InterviewsList: React.FC<InterviewsListProps> = ({ interviews }) => {
  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    if (result === 'response') {
      return (
        <Badge variant="success" className="flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Response
        </Badge>
      );
    }
    
    return (
      <Badge variant="danger" className="flex items-center">
        <XCircle className="h-3 w-3 mr-1" />
        Non-response
      </Badge>
    );
  };
  
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">Interview Details</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-1/4">Start Time</TableHead>
              <TableHead className="w-1/4">End Time</TableHead>
              <TableHead className="w-1/6">Duration</TableHead>
              <TableHead className="w-1/6">Location</TableHead>
              <TableHead className="w-1/6">Result</TableHead>
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
                  <div className="flex items-center" title={interview.start_address || ""}>
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="text-xs truncate">
                      {interview.start_latitude?.toFixed(4)}, {interview.start_longitude?.toFixed(4)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {interview.is_active ? (
                    <Badge variant="warning">Active</Badge>
                  ) : (
                    getResultBadge(interview.result)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InterviewsList;
