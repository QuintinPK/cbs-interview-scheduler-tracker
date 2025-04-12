
import React from "react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { Schedule } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export interface ScheduleGridProps {
  schedules: Schedule[];
  weekStart?: Date;
  loading?: boolean;
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (schedule: Schedule) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedules,
  weekStart = new Date(),
  loading = false,
  onEditSchedule,
  onDeleteSchedule
}) => {
  // Generate days of the week
  const week = eachDayOfInterval({
    start: startOfWeek(weekStart, { weekStartsOn: 1 }),
    end: endOfWeek(weekStart, { weekStartsOn: 1 })
  });

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
  
  // Group schedules by day
  const schedulesByDay: Record<string, Schedule[]> = {};
  
  week.forEach(day => {
    schedulesByDay[formatDateKey(day)] = [];
  });
  
  schedules.forEach(schedule => {
    const scheduleDate = formatDateKey(parseISO(schedule.start_time));
    if (schedulesByDay[scheduleDate]) {
      schedulesByDay[scheduleDate].push(schedule);
    }
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin h-8 w-8 border-4 border-cbs border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-7 gap-4">
      {week.map(day => (
        <div key={day.toString()} className="min-h-[150px]">
          <div className="text-center font-medium mb-2 py-2 bg-gray-100 rounded-md">
            {format(day, 'EEEE')}
            <div className="text-sm text-gray-500">
              {format(day, 'MMM d')}
            </div>
          </div>
          
          <div className="space-y-2">
            {schedulesByDay[formatDateKey(day)]?.map(schedule => (
              <Card key={schedule.id} className="border-l-4 border-cbs">
                <CardContent className="p-3">
                  <div className="text-sm font-medium">
                    {format(parseISO(schedule.start_time), 'HH:mm')} - {format(parseISO(schedule.end_time), 'HH:mm')}
                  </div>
                  
                  <div className={`text-xs py-0.5 px-2 rounded-full w-fit mt-1 ${getStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </div>
                  
                  {schedule.project_id && (
                    <div className="text-xs text-gray-500 mt-1">
                      Project: {schedule.project_id.substring(0, 8)}...
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2 space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => onEditSchedule(schedule)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive" 
                      onClick={() => onDeleteSchedule(schedule)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
