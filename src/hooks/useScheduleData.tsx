
import { useState, useEffect } from "react";
import { Schedule, Interviewer } from "@/types";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export const useScheduleData = (
  selectedInterviewer: Interviewer | undefined,
  schedules: Schedule[],
  weekStart: Date
) => {
  const [schedulesPerDay, setSchedulesPerDay] = useState<{ [key: string]: Schedule[] }>({});
  
  useEffect(() => {
    if (!selectedInterviewer) return;
    
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const groupedSchedules: { [key: string]: Schedule[] } = {};
    
    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      groupedSchedules[dateKey] = [];
    });
    
    schedules.forEach(schedule => {
      const scheduleDate = format(new Date(schedule.start_time), 'yyyy-MM-dd');
      
      if (groupedSchedules[scheduleDate]) {
        groupedSchedules[scheduleDate].push(schedule);
      }
    });
    
    setSchedulesPerDay(groupedSchedules);
  }, [selectedInterviewer, schedules, weekStart]);
  
  return {
    schedulesPerDay
  };
};
