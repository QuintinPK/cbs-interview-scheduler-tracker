
import React, { useState } from "react";
import { formatDateTime, formatTime } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Session } from "@/types";
import { 
  Clock, Calendar, Activity, 
  BarChart, Timer, TrendingUp, 
  Users, Award, Briefcase, MapPin
} from "lucide-react";
import CoordinatePopup from "../ui/CoordinatePopup";

interface ActivitySummaryProps {
  sessions: Session[];
  daysSinceLastActive: number;
  avgDaysPerWeek: number;
  daysWorkedInMonth: number;
  sessionsInPlanTime: number;
  avgSessionDuration: string;
  earliestStartTime: Date | null;
  latestEndTime: Date | null;
  activeSessions: Session[];
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({
  sessions,
  daysSinceLastActive,
  avgDaysPerWeek,
  daysWorkedInMonth,
  sessionsInPlanTime,
  avgSessionDuration,
  earliestStartTime,
  latestEndTime,
  activeSessions,
}) => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const handleCoordinateClick = (session: Session) => {
    if (session.start_latitude !== null && session.start_longitude !== null) {
      setSelectedCoordinate({ 
        lat: session.start_latitude, 
        lng: session.start_longitude 
      });
      setIsMapOpen(true);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-card to-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Recent Activity Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <Calendar className="h-4 w-4 mr-2 opacity-70" />
                  Recent Activity
                </h3>
                {sessions.length > 0 ? (
                  <div className="text-muted-foreground">
                    <p>Last active: {formatDateTime(sessions[0].start_time)}</p>
                    {sessions[0].start_latitude && sessions[0].start_longitude && (
                      <button 
                        className="flex items-center text-xs mt-1 text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleCoordinateClick(sessions[0])}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        View location
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No activity recorded yet</p>
                )}
              </div>
              
              {/* Time Since Last Login Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <Clock className="h-4 w-4 mr-2 opacity-70" />
                  Time Since Last Login
                </h3>
                <p className="text-muted-foreground">
                  {daysSinceLastActive === 0
                    ? "Active today"
                    : daysSinceLastActive === -1 
                      ? "Never active"
                      : `${daysSinceLastActive} day(s) ago`
                  }
                </p>
              </div>

              {/* Days Worked Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <Briefcase className="h-4 w-4 mr-2 opacity-70" />
                  Days Worked
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Per Week</p>
                    <p className="text-xl font-medium">{avgDaysPerWeek.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Past Month</p>
                    <p className="text-xl font-medium">{daysWorkedInMonth}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Sessions Metrics Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <Award className="h-4 w-4 mr-2 opacity-70" />
                  Sessions Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Within Planned Timeframe</p>
                    <div className="flex items-center mt-1">
                      <div className="h-2 bg-gray-200 rounded-full w-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ width: `${Math.min(100, sessionsInPlanTime)}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">{sessionsInPlanTime.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Average Duration</p>
                    <p className="text-xl font-medium flex items-center">
                      <Timer className="h-4 w-4 mr-1 opacity-70" />
                      {avgSessionDuration}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Working Hours Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <Clock className="h-4 w-4 mr-2 opacity-70" />
                  Working Hours
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Earliest Start</p>
                    <p className="text-xl font-medium">
                      {earliestStartTime ? formatTime(earliestStartTime) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latest End</p>
                    <p className="text-xl font-medium">
                      {latestEndTime ? formatTime(latestEndTime) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status Summary Card */}
              <div className="bg-card shadow-sm rounded-lg p-4 border border-border/50 transition-all hover:shadow-md">
                <h3 className="font-medium flex items-center text-primary mb-2">
                  <TrendingUp className="h-4 w-4 mr-2 opacity-70" />
                  Status Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <div className="flex items-center mt-1">
                      <div className={`h-2 w-2 rounded-full mr-2 ${activeSessions.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p>{activeSessions.length > 0 ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-xl font-medium flex items-center">
                      <Users className="h-4 w-4 mr-1 opacity-70" />
                      {sessions.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate}
      />
    </>
  );
};
