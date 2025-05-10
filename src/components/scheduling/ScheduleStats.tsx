import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { isAfter, isBefore, parseISO, differenceInMinutes } from 'date-fns';
interface ScheduleStatsProps {
  scheduledHours: number;
  workedHours: number;
}
export const ScheduleStats = ({
  scheduledHours,
  workedHours
}: ScheduleStatsProps) => {
  // Calculate current time efficiency by adjusting scheduled hours
  const now = new Date();

  // Format worked hours to show hours and minutes
  const formatHoursAndMinutes = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };
  const workTimeFormatted = formatHoursAndMinutes(workedHours);

  // Calculate efficiency percentage
  const efficiency = scheduledHours > 0 ? Math.round(workedHours / scheduledHours * 100) : 0;
  return <div className="flex gap-4 mb-4">
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-cbs">{scheduledHours}h</div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </CardContent>
      </Card>
      
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-green-600">{workTimeFormatted}</div>
          <div className="text-sm text-muted-foreground">Worked</div>
        </CardContent>
      </Card>
      
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-blue-600">{efficiency}%</div>
          <div className="text-sm text-muted-foreground">Current efficiency (scheduled vs worked)</div>
        </CardContent>
      </Card>
    </div>;
};