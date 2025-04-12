
import React from "react";
import { Session } from "@/types";
import { formatDuration, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, loading }) => {
  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground p-4">No sessions found</p>
      ) : (
        sessions.map((session) => (
          <Card key={session.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>Session {session.id.substring(0, 8)}</span>
                <Badge variant={session.is_active ? "default" : "secondary"}>
                  {session.is_active ? "Active" : "Completed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Start time</p>
                  <p className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    {formatDateTime(session.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">End time</p>
                  <p className="flex items-center">
                    {session.end_time ? (
                      <>
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        {formatDateTime(session.end_time)}
                      </>
                    ) : (
                      "In progress"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p>{formatDuration(session.start_time, session.end_time)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Start location</p>
                  {session.start_latitude && session.start_longitude ? (
                    <p className="flex items-center truncate">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                      {session.start_latitude.toFixed(4)}, {session.start_longitude.toFixed(4)}
                    </p>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default SessionList;
