import React, { useState, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, differenceInHours, differenceInMinutes } from "date-fns";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Schedule, Session } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";

interface ScheduleGridProps {
  currentWeekStart: Date;
  schedules: Schedule[];
  sessions: Session[];
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (schedule: Schedule) => void;
}

// Simple helper function to check time mismatch
const hasTimeMismatch = (scheduleStart: Date, scheduleEnd: Date, sessionStart: Date, sessionEnd: Date) => {
  const scheduledHours = differenceInHours(scheduleEnd, scheduleStart);
  const realisedHours = differenceInHours(sessionEnd, sessionStart);
  
  // Consider a mismatch if less than 50% of scheduled time was worked
  return realisedHours < (scheduledHours * 0.5);
};

// Format hours and minutes helper function
const formatHoursAndMinutes = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export const ScheduleGrid = ({
  currentWeekStart,
  schedules,
  sessions,
  onEditSchedule,
  onDeleteSchedule,
}: ScheduleGridProps) => {
  const [showRealised, setShowRealised] = useState(true);
  
  // Pre-calculate all data as much as possible to avoid recalculations during rendering
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    });
  }, [currentWeekStart]);
  
  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 8), []);
  
  // Process all schedules and sessions data ahead of time
  const processedData = useMemo(() => {
    // Create grid data structure
    const grid = weekDays.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const isCurrentDay = dayStr === format(new Date(), "yyyy-MM-dd");
      
      // Get schedules for this day
      const daySchedules = schedules.filter(schedule => {
        const scheduleDate = format(parseISO(schedule.start_time), "yyyy-MM-dd");
        return scheduleDate === dayStr && schedule.status !== "canceled";
      });
      
      // Get sessions for this day
      const daySessions = sessions.filter(session => {
        if (!session.start_time || !session.end_time) return false;
        const sessionDate = format(parseISO(session.start_time), "yyyy-MM-dd");
        return sessionDate === dayStr;
      });
      
      // Process hour cells for this day
      const hourCells = hours.map(hour => {
        // Get schedules for this hour
        const hourSchedules = daySchedules.filter(schedule => {
          const start = parseISO(schedule.start_time);
          const end = parseISO(schedule.end_time);
          const startHour = start.getHours();
          const endHour = end.getHours();
          return hour >= startHour && hour < endHour;
        });
        
        // Get sessions for this hour
        const hourSessions = daySessions.filter(session => {
          const start = parseISO(session.start_time);
          const end = parseISO(session.end_time);
          const startHour = start.getHours();
          const endHour = end.getHours();
          return hour >= startHour && hour < endHour;
        });
        
        // Process schedule items with any matching sessions
        const scheduleItems = hourSchedules.map(schedule => {
          const start = parseISO(schedule.start_time);
          const end = parseISO(schedule.end_time);
          
          // Find matching sessions for this schedule
          const matchingSessions = hourSessions.filter(session => {
            const sessionStart = parseISO(session.start_time);
            return (
              sessionStart.getDate() === start.getDate() &&
              sessionStart.getMonth() === start.getMonth() &&
              sessionStart.getFullYear() === start.getFullYear()
            );
          });
          
          return {
            schedule,
            start,
            end,
            hasMatches: matchingSessions.length > 0
          };
        });
        
        // Process session items with mismatch detection
        const sessionItems = hourSessions.map(session => {
          const start = parseISO(session.start_time);
          const end = parseISO(session.end_time as string);
          
          // Find matching schedule to check for mismatches
          const matchingSchedule = hourSchedules.find(schedule => {
            const scheduleStart = parseISO(schedule.start_time);
            return (
              scheduleStart.getDate() === start.getDate() &&
              scheduleStart.getMonth() === start.getMonth() &&
              scheduleStart.getFullYear() === start.getFullYear()
            );
          });
          
          let hasMismatch = false;
          
          if (matchingSchedule) {
            const scheduleStart = parseISO(matchingSchedule.start_time);
            const scheduleEnd = parseISO(matchingSchedule.end_time);
            hasMismatch = hasTimeMismatch(scheduleStart, scheduleEnd, start, end);
          }
          
          return {
            session,
            start,
            end,
            hasMismatch,
            hasMatchingSchedule: !!matchingSchedule
          };
        });
        
        return {
          hour,
          scheduleItems,
          sessionItems
        };
      });
      
      return {
        day,
        dayStr,
        isCurrentDay,
        hourCells
      };
    });
    
    return grid;
  }, [weekDays, hours, schedules, sessions]);
  
  // Handle showing/hiding realised sessions
  const handleToggleRealised = (checked: boolean) => {
    setShowRealised(checked);
  };

  // Calculate total scheduled and worked hours
  const { scheduledHours, workedHours } = useMemo(() => {
    // Only include non-canceled schedules
    const scheduled = schedules
      .filter(schedule => schedule.status !== "canceled")
      .reduce((total, schedule) => {
        const start = parseISO(schedule.start_time);
        const end = parseISO(schedule.end_time);
        return total + differenceInHours(end, start);
      }, 0);
    
    // Calculate worked hours with minutes precision
    const worked = sessions.reduce((total, session) => {
      if (!session.end_time) return total;
      const start = parseISO(session.start_time);
      const end = parseISO(session.end_time);
      
      // Calculate total minutes first for better precision
      const minutes = differenceInMinutes(end, start);
      return total + (minutes / 60);
    }, 0);
    
    return { scheduledHours: scheduled, workedHours: worked };
  }, [schedules, sessions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ScheduleStats scheduledHours={scheduledHours} workedHours={workedHours} />
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-realised" 
            checked={showRealised}
            onCheckedChange={handleToggleRealised}
          />
          <Label htmlFor="show-realised">Show realised sessions</Label>
        </div>
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
                
                {processedData.map((dayData, dayIndex) => (
                  <div 
                    key={`${dayData.dayStr}-${hour}`}
                    className={`p-2 min-h-[80px] relative ${dayData.isCurrentDay ? "bg-cbs/5" : ""}`}
                  >
                    {/* Render scheduled blocks */}
                    {dayData.hourCells[hours.indexOf(hour)].scheduleItems.map((item, index) => (
                      <div 
                        key={`schedule-${item.schedule.id}-${hour}-${index}`}
                        className={`absolute inset-x-1 p-1 rounded-md text-xs ${
                          item.schedule.status === "completed" 
                            ? "bg-green-100 border border-green-300"
                            : item.schedule.status === "canceled"
                              ? "bg-gray-100 border border-gray-300 opacity-60"
                              : "bg-cbs-light/20 border border-cbs-light/40"
                        } ${showRealised && item.hasMatches ? 'left-1 right-1/2 mr-1' : 'inset-x-1'}`}
                        style={{
                          top: "4px",
                          minHeight: "72px"
                        }}
                      >
                        <div className="font-medium">
                          {format(item.start, "HH:mm")} - {format(item.end, "HH:mm")}
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-xs">{item.schedule.status}</span>
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => onEditSchedule(item.schedule)}
                              className="text-cbs hover:text-cbs-light"
                            >
                              <Pencil size={10} />
                            </button>
                            <button 
                              onClick={() => onDeleteSchedule(item.schedule)}
                              className="text-destructive hover:text-destructive/70"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Render realised session blocks */}
                    {showRealised && dayData.hourCells[hours.indexOf(hour)].sessionItems.map((item, index) => (
                      <TooltipProvider key={`session-${item.session.id}-${hour}-${index}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute p-1 rounded-md text-xs ${
                                item.hasMatchingSchedule ? 'left-1/2 right-1 ml-1' : 'inset-x-1'
                              } bg-gray-100 border border-gray-300`}
                              style={{
                                top: "4px",
                                minHeight: "72px"
                              }}
                            >
                              <div className="font-medium">
                                {format(item.start, "HH:mm")} - {format(item.end, "HH:mm")}
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs">realised</span>
                                {item.hasMismatch && (
                                  <AlertCircle size={12} className="text-orange-500" />
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          {item.hasMismatch && (
                            <TooltipContent>
                              <p>Worked less than scheduled</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
