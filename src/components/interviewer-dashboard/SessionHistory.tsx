
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
import { Session } from "@/types";
import { MapPin } from "lucide-react";
import CoordinatePopup from "../ui/CoordinatePopup";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionHistoryProps {
  sessions: Session[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  showProject?: boolean;
  projectNameResolver?: (projectId: string) => string;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  dateRange,
  setDateRange,
  showProject = false,
  projectNameResolver = (id) => id
}) => {
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = React.useState<{lat: number, lng: number} | null>(null);
  
  const handleViewLocation = (session: Session) => {
    if (session.start_latitude && session.start_longitude) {
      setSelectedCoordinate({
        lat: session.start_latitude,
        lng: session.start_longitude
      });
      setIsMapOpen(true);
    }
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
                  
                  return (
                    <TableRow key={session.id}>
                      {showProject && (
                        <TableCell>
                          {session.project_id ? projectNameResolver(session.project_id) : "—"}
                        </TableCell>
                      )}
                      <TableCell>{formatDateTime(session.start_time)}</TableCell>
                      <TableCell>
                        {endTime ? formatDateTime(session.end_time as string) : "Active"}
                      </TableCell>
                      <TableCell>
                        {duration
                          ? `${hours}h ${minutes}m`
                          : "—"}
                      </TableCell>
                      <TableCell>
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
