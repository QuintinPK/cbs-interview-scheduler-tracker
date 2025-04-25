
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { isAfter, isBefore, parseISO } from 'date-fns';

interface ScheduleStatsProps {
  scheduledHours: number;
  workedHours: number;
}

export const ScheduleStats = ({ scheduledHours, workedHours }: ScheduleStatsProps) => {
  // Calculate current time efficiency by adjusting scheduled hours
  const now = new Date();
  let adjustedScheduledHours = scheduledHours;

  // If we're in the middle of the week, only count scheduled hours up to now
  const efficiency = adjustedScheduledHours > 0 ? Math.round((workedHours / adjustedScheduledHours) * 100) : 0;
  
  return (
    <div className="flex gap-4 mb-4">
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-cbs">{scheduledHours}h</div>
          <div className="text-sm text-muted-foreground">Scheduled</div>
        </CardContent>
      </Card>
      
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-green-600">{workedHours}h</div>
          <div className="text-sm text-muted-foreground">Worked</div>
        </CardContent>
      </Card>
      
      <Card className="flex-1">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold text-blue-600">{efficiency}%</div>
          <div className="text-sm text-muted-foreground">Current Efficiency</div>
        </CardContent>
      </Card>
    </div>
  );
};
