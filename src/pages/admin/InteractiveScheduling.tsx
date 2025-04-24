
import React, { useState } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";

import AdminLayout from "@/components/layout/AdminLayout";
import { DateNavigator } from "@/components/scheduling/DateNavigator";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import GlobalFilter from "@/components/GlobalFilter";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { useFilter } from "@/contexts/FilterContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const InteractiveScheduling = () => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);

  // Fetch interviewers
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { filterInterviewers } = useFilter();

  // Filtered interviewers based on global filters
  const filteredInterviewers = filterInterviewers(interviewers);

  // Generate week dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  // Default to the first interviewer if none selected
  React.useEffect(() => {
    if (filteredInterviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(filteredInterviewers[0].id);
    }
  }, [filteredInterviewers, selectedInterviewerId]);

  // Hours for the time slots (8:00–20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Fetch schedules and sessions for the selected interviewer and week
  const {
    schedules,
    loading: schedulesLoading,
    addSchedule,
    deleteSchedule,
  } = useSchedules(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  const { sessions, loading: sessionsLoading } = useSessions(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

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

  // Handle date navigation
  const handleDateChange = (date: Date) => {
    // Ensure we always start from Monday
    setCurrentDate(startOfWeek(date, { weekStartsOn: 1 }));
  };

  // Navigate to previous/next week
  const navigateToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const navigateToPrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  // Reset to current week
  const resetToToday = () => {
    setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Get interviewer to display in the grid
  const interviewerToShow = selectedInterviewerId 
    ? filteredInterviewers.filter(i => i.id === selectedInterviewerId) 
    : [];

  return (
    <AdminLayout showFilters={false}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Interactive Weekly Scheduling</h1>
            <p className="text-muted-foreground mt-1">
              Click and drag to schedule or unschedule multiple time slots
            </p>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GlobalFilter />
        </div>

        {/* Date Navigator - customized to allow week navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <button 
              onClick={navigateToPrevWeek} 
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Previous week"
            >
              ←
            </button>
            <div className="font-medium">
              Week of {format(weekStart, "MMMM d, yyyy")}
            </div>
            <button 
              onClick={navigateToNextWeek} 
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Next week"
            >
              →
            </button>
          </div>
          <button 
            onClick={resetToToday} 
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm"
          >
            Current Week
          </button>
        </div>

        {/* Interviewer selector */}
        {filteredInterviewers.length > 0 && (
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
        ) : !selectedInterviewerId || interviewerToShow.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewers Found</h3>
            <p className="text-muted-foreground">Please select an interviewer to continue</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Weekly Schedule for {interviewerToShow[0]?.code || ""}: {
                interviewerToShow[0]?.first_name || ""} {interviewerToShow[0]?.last_name || ""} 
                ({format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")})
              </h2>
            </div>
            <InteractiveScheduleGrid
              currentDate={currentDate}
              weekDates={weekDates}
              interviewers={interviewerToShow}
              schedules={schedules}
              sessions={sessions}
              onScheduleSlot={handleScheduleSlot}
              onUnscheduleSlot={handleUnscheduleSlot}
              hours={hours}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InteractiveScheduling;
