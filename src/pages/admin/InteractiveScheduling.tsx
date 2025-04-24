
import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";

import AdminLayout from "@/components/layout/AdminLayout";
import GlobalFilter from "@/components/GlobalFilter";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { useFilter } from "@/contexts/FilterContext";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const InteractiveScheduling = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);

  // Fetch interviewers using the hook
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { filterInterviewers } = useFilter();

  // Filtered interviewers based on global filters
  const filteredInterviewers = filterInterviewers(interviewers);

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  // Set default interviewer if none selected
  useEffect(() => {
    if (filteredInterviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(filteredInterviewers[0].id);
    }
  }, [filteredInterviewers, selectedInterviewerId]);

  // Fetch schedules for the selected interviewer and week
  const {
    schedules,
    loading: schedulesLoading,
    refresh: refreshSchedules
  } = useSchedules(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  // Fetch sessions for the selected interviewer and week
  const { 
    sessions, 
    loading: sessionsLoading 
  } = useSessions(selectedInterviewerId ?? undefined, weekStartStr, weekEndStr);

  // Combined loading state
  const isLoading = interviewersLoading || schedulesLoading || sessionsLoading;

  // Navigate to previous/next week
  const navigateToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const navigateToPrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Reset to current week
  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Handler for when schedules change
  const handleSchedulesChanged = () => {
    refreshSchedules();
  };

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

        {/* Week Navigator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={navigateToPrevWeek} 
              variant="outline"
              size="sm"
              aria-label="Previous week"
            >
              ←
            </Button>
            <div className="font-medium">
              Week of {format(currentWeekStart, "MMMM d, yyyy")}
            </div>
            <Button 
              onClick={navigateToNextWeek} 
              variant="outline"
              size="sm"
              aria-label="Next week"
            >
              →
            </Button>
          </div>
          <Button 
            onClick={resetToCurrentWeek} 
            variant="secondary"
            size="sm"
          >
            Current Week
          </Button>
        </div>

        {/* Interviewer selector */}
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
                Weekly Schedule for {filteredInterviewers.find(i => i.id === selectedInterviewerId)?.code || ""}: {
                filteredInterviewers.find(i => i.id === selectedInterviewerId)?.first_name || ""} {
                filteredInterviewers.find(i => i.id === selectedInterviewerId)?.last_name || ""} 
                ({format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")})
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
