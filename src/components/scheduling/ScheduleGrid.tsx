
import React from "react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Schedule } from "@/types";

interface ScheduleGridProps {
  currentWeekStart: Date;
  schedules: Schedule[];
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (schedule: Schedule) => void;
}

export const ScheduleGrid = ({
  currentWeekStart,
  schedules,
  onEditSchedule,
  onDeleteSchedule,
}: ScheduleGridProps) => {
  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });
  
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  
  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.start_time);
      return (
        scheduleDate.getDate() === day.getDate() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getFullYear() === day.getFullYear()
      );
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[768px]">
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-center font-medium border-r">Hour</div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={`p-2 text-center font-medium ${
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") 
                  ? "bg-cbs/10" 
                  : ""
              }`}
            >
              <div>{format(day, "EEE")}</div>
              <div className="text-sm">{format(day, "MMM d")}</div>
            </div>
          ))}
        </div>
        
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 text-center text-sm font-medium border-r">
                {hour}:00
              </div>
              
              {weekDays.map((day, dayIndex) => {
                const daySchedules = getSchedulesForDay(day);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`p-2 min-h-[80px] relative ${
                      format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") 
                        ? "bg-cbs/5" 
                        : ""
                    }`}
                  >
                    {daySchedules.map((schedule) => {
                      const start = parseISO(schedule.start_time);
                      const end = parseISO(schedule.end_time);
                      const startHour = start.getHours();
                      const endHour = end.getHours();
                      
                      if (hour >= startHour && hour < endHour) {
                        return (
                          <div 
                            key={schedule.id}
                            className={`absolute inset-x-1 p-1 rounded-md text-xs ${
                              schedule.status === "completed" 
                                ? "bg-green-100 border border-green-300"
                                : schedule.status === "cancelled"
                                  ? "bg-gray-100 border border-gray-300 opacity-60"
                                  : "bg-cbs-light/20 border border-cbs-light/40"
                            }`}
                            style={{
                              top: "4px",
                              minHeight: "72px"
                            }}
                          >
                            <div className="font-medium">
                              {format(start, "HH:mm")} - {format(end, "HH:mm")}
                            </div>
                            <div className="mt-1 flex justify-between">
                              <span className="text-xs">{schedule.status}</span>
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => onEditSchedule(schedule)}
                                  className="text-cbs hover:text-cbs-light"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button 
                                  onClick={() => onDeleteSchedule(schedule)}
                                  className="text-destructive hover:text-destructive/70"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
