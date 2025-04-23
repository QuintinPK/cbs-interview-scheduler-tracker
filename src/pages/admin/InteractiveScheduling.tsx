
import React, { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Calendar } from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import { DateNavigator } from "@/components/scheduling/DateNavigator";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import GlobalFilter from "@/components/GlobalFilter";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { useFilter } from "@/contexts/FilterContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const InteractiveScheduling = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);

  // Fetch interviewers, schedules, and sessions
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { filterInterviewers } = useFilter();

  // Filtered interviewers based on global filters
  const filteredInterviewers = filterInterviewers(interviewers);
  
  // For day view, show all filtered interviewers; for week view, show only the selected one
  const interviewersToShow =
    viewMode === "day"
      ? filteredInterviewers
      : filteredInterviewers.filter(i => i.id === selectedInterviewerId);

  const formattedDate = format(currentDate, "yyyy-MM-dd");

  // In week view, fetch schedules/sessions for the whole week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const schedulesRange = viewMode === "week" ? [selectedInterviewerId ?? undefined, weekStartStr, weekEndStr] : [undefined, formattedDate, formattedDate];
  const sessionsRange = schedulesRange;

  const {
    schedules,
    loading: schedulesLoading,
    addSchedule,
    deleteSchedule,
  } = useSchedules(...schedulesRange);

  const { sessions, loading: sessionsLoading } = useSessions(...sessionsRange);

  // Combined loading state
  const isLoading = interviewersLoading || schedulesLoading || sessionsLoading;

  // Handle scheduling a time slot
  const handleScheduleSlot = async (interviewerId: string, startTime: Date, endTime: Date) => {
    try {
      await addSchedule({
        interviewer_id: interviewerId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled",
      });
    } catch (error) {
      console.error("Error scheduling slot:", error);
    }
  };

  // Handle unscheduling a time slot
  const handleUnscheduleSlot = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
    } catch (error) {
      console.error("Error unscheduling slot:", error);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Reset to today
  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const showWeekInterviewerSelector = viewMode === "week" && filteredInterviewers.length > 0;

  // In week view, pick the first filtered interviewer if none selected
  React.useEffect(() => {
    if (viewMode === "week" && filteredInterviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(filteredInterviewers[0].id);
    }
    if (viewMode === "day") {
      setSelectedInterviewerId(null);
    }
    // Only runs when viewMode or filteredInterviewers changes
    // eslint-disable-next-line
  }, [viewMode, filteredInterviewers]);

  return (
    <AdminLayout showFilters={false}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Interactive Scheduling</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Click and drag to schedule multiple slots</span>
            </div>
          </div>
          {/* View mode switch */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
            >
              Day View
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              disabled={filteredInterviewers.length === 0}
            >
              Week View
            </Button>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GlobalFilter />
        </div>

        {/* Date Navigator (always show, controls current day or week) */}
        <DateNavigator
          currentDate={currentDate}
          onDateChange={handleDateChange}
          onResetToToday={resetToToday}
        />

        {/* In week view, show interviewer selector */}
        {showWeekInterviewerSelector && (
          <div className="flex gap-2 items-center mb-2">
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

        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">Loading...</h3>
          </div>
        ) : (interviewersToShow.length === 0 || (viewMode === "week" && !selectedInterviewerId)) ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewers Found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                {viewMode === "day"
                  ? `Daily Schedule for ${format(currentDate, "EEEE, MMMM d, yyyy")}`
                  : `Weekly Schedule for ${interviewersToShow[0].code}: ${interviewersToShow[0].first_name} ${interviewersToShow[0].last_name} (${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")})`}
              </h2>
            </div>
            <InteractiveScheduleGrid
              currentDate={currentDate}
              weekDates={viewMode === "week" ? weekDates : undefined}
              interviewers={interviewersToShow}
              schedules={schedules}
              sessions={sessions}
              onScheduleSlot={handleScheduleSlot}
              onUnscheduleSlot={handleUnscheduleSlot}
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InteractiveScheduling;
