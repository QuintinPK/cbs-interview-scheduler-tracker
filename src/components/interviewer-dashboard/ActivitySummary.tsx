
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Session } from "@/types";
import CoordinatePopup from "../ui/CoordinatePopup";
import { useCoordinatePopup } from "@/hooks/useCoordinatePopup";
import { RecentActivityCard } from "./cards/RecentActivityCard";
import { LastLoginCard } from "./cards/LastLoginCard";
import { DaysWorkedCard } from "./cards/DaysWorkedCard";
import { SessionsMetricsCard } from "./cards/SessionsMetricsCard";
import { WorkingHoursCard } from "./cards/WorkingHoursCard";
import { StatusSummaryCard } from "./cards/StatusSummaryCard";

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
  const {
    selectedCoordinate,
    isMapOpen,
    handleCoordinateClick,
    closeMap
  } = useCoordinatePopup();
  
  const handleViewLocation = (session: Session) => {
    if (session.start_latitude !== null && session.start_longitude !== null) {
      handleCoordinateClick(session.start_latitude, session.start_longitude);
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
              <RecentActivityCard 
                sessions={sessions}
                onViewLocation={handleViewLocation}
              />
              
              <LastLoginCard 
                daysSinceLastActive={daysSinceLastActive}
              />

              <DaysWorkedCard 
                avgDaysPerWeek={avgDaysPerWeek}
                daysWorkedInMonth={daysWorkedInMonth}
              />
            </div>
            
            <div className="space-y-6">
              <SessionsMetricsCard 
                sessionsInPlanTime={sessionsInPlanTime}
                avgSessionDuration={avgSessionDuration}
              />
              
              <WorkingHoursCard 
                earliestStartTime={earliestStartTime}
                latestEndTime={latestEndTime}
              />
              
              <StatusSummaryCard 
                activeSessions={activeSessions}
                totalSessions={sessions.length}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={closeMap} 
        coordinate={selectedCoordinate ? {
          latitude: selectedCoordinate.lat,
          longitude: selectedCoordinate.lng
        } : null}
      />
    </>
  );
};
