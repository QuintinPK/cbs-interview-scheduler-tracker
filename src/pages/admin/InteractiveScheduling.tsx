import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";
import { InterviewerSelector } from "@/components/scheduling/InterviewerSelector";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";
import InteractiveScheduleGrid from "@/components/scheduling/InteractiveScheduleGrid";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { format, startOfWeek } from "date-fns";

const InteractiveScheduling = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekDates[6], "yyyy-MM-dd");

  const { interviewers, loading: interviewersLoading } = useInterviewers();

  const {
    schedules,
    loading: schedulesLoading,
    refresh: refreshSchedules
  } = useSchedules(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  const { 
    sessions, 
    loading: sessionsLoading 
  } = useSessions(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  const isLoading = schedulesLoading || sessionsLoading || interviewersLoading;

  // Calculate scheduled and worked hours for the current week
  const scheduledHours = schedules.reduce((total, schedule) => {
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

  const handleInterviewerSelect = (interviewerId: string) => {
    setSelectedInterviewerId(interviewerId);
  };

  const handleSchedulesChanged = () => {
    refreshSchedules();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Interactive Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <InterviewerSelector
                interviewers={interviewers}
                loading={interviewersLoading}
                onSelect={handleInterviewerSelect}
              />
            </div>

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
                    interviewerId={selectedInterviewerId ?? ""}
                    schedules={schedules}
                    sessions={sessions}
                    onSchedulesChanged={handleSchedulesChanged}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default InteractiveScheduling;
