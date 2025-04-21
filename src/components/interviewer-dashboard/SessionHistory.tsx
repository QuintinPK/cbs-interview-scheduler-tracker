
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Session } from "@/types";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";

interface SessionHistoryProps {
  sessions: Session[];
  dateRange?: DateRange;
  setDateRange: (date: DateRange | undefined) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  dateRange,
  setDateRange,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session History</CardTitle>
        <DatePickerWithRange 
          value={dateRange} 
          onChange={setDateRange}
          className="w-[260px]"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No sessions found for the selected period
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col space-y-2 border-b pb-4 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {format(new Date(session.start_time), "PPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.start_time), "p")} -{" "}
                      {session.end_time
                        ? format(new Date(session.end_time), "p")
                        : "Ongoing"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.project_id && (
                      <Badge variant="outline">
                        Project: {session.project_id}
                      </Badge>
                    )}
                    {session.is_active && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
