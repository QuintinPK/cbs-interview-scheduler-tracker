
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface ScheduleStatsProps {
  scheduledHours: number;
  workedHours: number;
}

export const ScheduleStats = ({ scheduledHours, workedHours }: ScheduleStatsProps) => {
  const efficiency = scheduledHours > 0 ? Math.round((workedHours / scheduledHours) * 100) : 0;
  
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
          <div className="text-sm text-muted-foreground">Efficiency</div>
        </CardContent>
      </Card>
    </div>
  );
};
