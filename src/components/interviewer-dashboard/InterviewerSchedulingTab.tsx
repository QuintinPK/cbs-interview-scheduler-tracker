
import React, { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { Interviewer } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface InterviewerSchedulingTabProps {
  interviewer: Interviewer | null;
}

export const InterviewerSchedulingTab = ({ interviewer }: InterviewerSchedulingTabProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekDates[6], "yyyy-MM-dd");

  const {
    schedules,
    loading: schedulesLoading,
    refresh: refreshSchedules
  } = useSchedules(interviewer?.id ?? undefined, weekStartStr, weekEndStr);

  const { 
    sessions, 
    loading: sessionsLoading 
  } = useSessions(interviewer?.id ?? undefined, weekStartStr, weekEndStr);

  const isLoading = schedulesLoading || sessionsLoading || !interviewer;

  // Calculate scheduled and worked hours for the current week
  const scheduledHours = schedules
    .filter(schedule => schedule.status !== "canceled")
    .reduce((total, schedule) => {
      const start = new Date(schedule.start_time);
      const end = new Date(schedule.end_time);
      return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }, 0);

  const workedHours = sessions.reduce((total, session) => {
    if (!session.end_time) return total;
    
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }, 0);

  const handleWeekChange = (newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  };

  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleSchedulesChanged = () => {
    refreshSchedules();
  };

  if (!interviewer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <WeekNavigator
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          onResetToCurrentWeek={resetToCurrentWeek}
        />

        {!isLoading && (
          <ScheduleStats 
            scheduledHours={scheduledHours} 
            workedHours={workedHours}
          />
        )}

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading schedule...</p>
          </div>
        ) : (
          <div className="p-4">
            <InteractiveScheduleGrid
              weekDates={weekDates}
              interviewerId={interviewer.id}
              schedules={schedules}
              sessions={sessions}
              onSchedulesChanged={handleSchedulesChanged}
            />
          </div>
        )}
      </div>
    </div>
  );
};
