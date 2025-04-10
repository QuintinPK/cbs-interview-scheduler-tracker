
import React, { useState } from "react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, differenceInHours } from "date-fns";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Schedule, Session } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScheduleGridProps {
  currentWeekStart: Date;
  schedules: Schedule[];
  sessions: Session[];
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (schedule: Schedule) => void;
}

export const ScheduleGrid = ({
  currentWeekStart,
  schedules,
  sessions,
  onEditSchedule,
  onDeleteSchedule,
}: ScheduleGridProps) => {
  const [showRealised, setShowRealised] = useState(true);
  
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

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      const sessionDate = parseISO(session.start_time);
      return (
        sessionDate.getDate() === day.getDate() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getFullYear() === day.getFullYear() &&
        session.end_time // Only include completed sessions
      );
    });
  };
  
  // Helper to check if there's a substantial mismatch between scheduled and realised time
  const hasTimeMismatch = (scheduleStart: Date, scheduleEnd: Date, sessionStart: Date, sessionEnd: Date) => {
    const scheduledHours = differenceInHours(scheduleEnd, scheduleStart);
    const realisedHours = differenceInHours(sessionEnd, sessionStart);
    
    // Consider a mismatch if less than 50% of scheduled time was worked
    return realisedHours < (scheduledHours * 0.5);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 ml-auto w-fit">
        <Switch 
          id="show-realised" 
          checked={showRealised}
          onCheckedChange={setShowRealised}
        />
        <Label htmlFor="show-realised">Show realised sessions</Label>
      </div>
      
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
                  const daySessions = showRealised ? getSessionsForDay(day) : [];
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-2 min-h-[80px] relative ${
                        format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") 
                          ? "bg-cbs/5" 
                          : ""
                      }`}
                    >
                      {/* Scheduled blocks */}
                      {daySchedules.map((schedule) => {
                        const start = parseISO(schedule.start_time);
                        const end = parseISO(schedule.end_time);
                        const startHour = start.getHours();
                        const endHour = end.getHours();
                        
                        if (hour >= startHour && hour < endHour) {
                          // Find matching sessions for this schedule to check for mismatches
                          const matchingSessions = daySessions.filter(session => {
                            const sessionDate = parseISO(session.start_time);
                            return sessionDate.getDate() === start.getDate() &&
                                  sessionDate.getMonth() === start.getMonth() &&
                                  sessionDate.getFullYear() === start.getFullYear();
                          });
                          
                          return (
                            <div 
                              key={schedule.id}
                              className={`absolute inset-x-1 p-1 rounded-md text-xs ${
                                schedule.status === "completed" 
                                  ? "bg-green-100 border border-green-300"
                                  : schedule.status === "cancelled"
                                    ? "bg-gray-100 border border-gray-300 opacity-60"
                                    : "bg-cbs-light/20 border border-cbs-light/40"
                              } ${showRealised && matchingSessions.length > 0 ? 'left-1 right-1/2 mr-1' : 'inset-x-1'}`}
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
                      
                      {/* Realised blocks (actual sessions) */}
                      {showRealised && daySessions.map((session) => {
                        if (!session.end_time) return null; // Skip ongoing sessions
                        
                        const start = parseISO(session.start_time);
                        const end = parseISO(session.end_time);
                        const startHour = start.getHours();
                        const endHour = end.getHours();
                        
                        if (hour >= startHour && hour < endHour) {
                          // Find matching schedule to check for mismatches
                          const matchingSchedule = daySchedules.find(schedule => {
                            const scheduleDate = parseISO(schedule.start_time);
                            return scheduleDate.getDate() === start.getDate() &&
                                  scheduleDate.getMonth() === start.getMonth() &&
                                  scheduleDate.getFullYear() === start.getFullYear();
                          });
                          
                          const hasMismatch = matchingSchedule ? 
                            hasTimeMismatch(
                              parseISO(matchingSchedule.start_time), 
                              parseISO(matchingSchedule.end_time), 
                              start, 
                              end
                            ) : false;
                            
                          return (
                            <TooltipProvider key={session.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={`absolute p-1 rounded-md text-xs ${
                                      matchingSchedule ? 'left-1/2 right-1 ml-1' : 'inset-x-1'
                                    } bg-gray-100 border border-gray-300`}
                                    style={{
                                      top: "4px",
                                      minHeight: "72px"
                                    }}
                                  >
                                    <div className="font-medium">
                                      {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs">realised</span>
                                      {hasMismatch && (
                                        <AlertCircle size={12} className="text-orange-500" />
                                      )}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                {hasMismatch && (
                                  <TooltipContent>
                                    <p>Worked less than scheduled</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
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
    </div>
  );
};
