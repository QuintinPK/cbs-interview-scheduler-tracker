
import { useState, useEffect } from "react";
import { Schedule, Interviewer } from "@/types";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export const useScheduleData = (
  selectedInterviewer?: Interviewer,
  schedules: Schedule[] = [],
  weekStart: Date = new Date()
) => {
  const [schedulesPerDay, setSchedulesPerDay] = useState<{ [key: string]: Schedule[] }>({});
  
  useEffect(() => {
    if (!selectedInterviewer && schedules.length === 0) {
      // Initialize with empty data if no interviewer or schedules
      const currentWeekStart = startOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
      
      const emptySchedules: { [key: string]: Schedule[] } = {};
      weekDays.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        emptySchedules[dateKey] = [];
      });
      
      setSchedulesPerDay(emptySchedules);
      return;
    }
    
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
