import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO, differenceInHours, isBefore, isAfter, isWithinInterval } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

import AdminLayout from "@/components/layout/AdminLayout";
import GlobalFilter from "@/components/GlobalFilter";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { useFilter } from "@/contexts/FilterContext";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";

const InteractiveScheduling = () => {
  const [searchParams] = useSearchParams();
  const interviewerCodeFromUrl = searchParams.get("interviewer");
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);

  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { filterInterviewers } = useFilter();

  const filteredInterviewers = filterInterviewers(interviewers);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  useEffect(() => {
    if (interviewerCodeFromUrl && filteredInterviewers.length > 0 && !selectedInterviewerId) {
      const matchedInterviewer = filteredInterviewers.find(
        (interviewer) => interviewer.code?.toLowerCase() === interviewerCodeFromUrl.toLowerCase()
      );
      
      if (matchedInterviewer) {
        setSelectedInterviewerId(matchedInterviewer.id);
      } else {
        setSelectedInterviewerId(filteredInterviewers[0].id);
      }
    } else if (filteredInterviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(filteredInterviewers[0].id);
    }
  }, [filteredInterviewers, interviewerCodeFromUrl, selectedInterviewerId]);

  const {
    schedules,
    loading: schedulesLoading,
    refresh: refreshSchedules
  } = useSchedules(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  const { 
    sessions, 
    loading: sessionsLoading 
  } = useSessions(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  const isLoading = interviewersLoading || schedulesLoading || sessionsLoading;

  const now = new Date();
  
  // Corrected scheduled hours calculation to only count schedules in the selected week
  // and with status not equal to "canceled"
  const scheduledHours = schedules
    .filter(schedule => schedule.status !== "canceled")
    .reduce((total, schedule) => {
      const start = parseISO(schedule.start_time);
      const end = parseISO(schedule.end_time);
      return total + differenceInHours(end, start);
    }, 0);

  // Corrected worked hours calculation to only include sessions within the selected week
  // that have both start and end times
  const workedHours = sessions.reduce((total, session) => {
    if (!session.start_time || !session.end_time) return total;
    
    const start = parseISO(session.start_time);
    const end = parseISO(session.end_time);
    
    // Calculate hours with decimal precision for minutes
    const hours = differenceInHours(end, start);
    const minutes = differenceInHours(end, start, { precision: 'minutes' }) - hours;
    
    return total + hours + (minutes / 60);
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

  return (
    <AdminLayout showFilters={false}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Weekly Scheduling</h1>
            <p className="text-muted-foreground mt-1">
              Click and drag to schedule or unschedule multiple time slots
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GlobalFilter />
        </div>

        <WeekNavigator
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          onResetToCurrentWeek={resetToCurrentWeek}
        />

        {filteredInterviewers.length > 0 && (
          <div className="flex gap-2 items-center bg-white p-4 rounded-lg border">
            <label className="font-medium text-sm">Interviewer:</label>
            <Select
              value={selectedInterviewerId ?? ""}
              onValueChange={setSelectedInterviewerId}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select interviewer" />
              </SelectTrigger>
              <SelectContent>
                {filteredInterviewers.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.code}: {i.first_name} {i.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isLoading && selectedInterviewerId && (
          <ScheduleStats 
            scheduledHours={scheduledHours} 
            workedHours={workedHours}
          />
        )}

        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">Loading...</h3>
          </div>
        ) : !selectedInterviewerId || filteredInterviewers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewers Found</h3>
            <p className="text-muted-foreground">Please select an interviewer to continue</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Weekly Schedule for {" "}
                <Link 
                  to={`/admin/interviewer/${selectedInterviewerId}`}
                  className="text-primary hover:underline"
                >
                  {filteredInterviewers.find(i => i.id === selectedInterviewerId)?.code || ""}: {
                  filteredInterviewers.find(i => i.id === selectedInterviewerId)?.first_name || ""} {
                  filteredInterviewers.find(i => i.id === selectedInterviewerId)?.last_name || ""}
                </Link>
                {" "}({format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")})
              </h2>
            </div>
            <InteractiveScheduleGrid
              weekDates={weekDates}
              interviewerId={selectedInterviewerId}
              schedules={schedules}
              sessions={sessions}
              onSchedulesChanged={handleSchedulesChanged}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InteractiveScheduling;
