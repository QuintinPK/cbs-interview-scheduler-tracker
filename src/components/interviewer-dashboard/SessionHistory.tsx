
import React from "react";
import { DateRange } from "react-day-picker";
import { MapPin } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Session } from "@/types";
import { formatDateTime, calculateDuration } from "@/lib/utils";

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
  return (
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
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No sessions recorded
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDateTime(session.start_time)}</TableCell>
                    <TableCell>
                      {session.end_time ? formatDateTime(session.end_time) : 'Active'}
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
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
