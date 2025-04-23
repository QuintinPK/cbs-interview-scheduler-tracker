
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import { DateNavigator } from "@/components/scheduling/DateNavigator";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";

import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";

const InteractiveScheduling = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Fetch interviewers, schedules, and sessions
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  
  const { 
    schedules, 
    loading: schedulesLoading,
    addSchedule,
    deleteSchedule
  } = useSchedules(undefined, formattedDate, formattedDate);
  
  const {
    sessions,
    loading: sessionsLoading
  } = useSessions(undefined, formattedDate, formattedDate);
  
  // Combined loading state
  const isLoading = interviewersLoading || schedulesLoading || sessionsLoading;
  
  // Handle scheduling a time slot
  const handleScheduleSlot = async (interviewerId: string, startTime: Date, endTime: Date) => {
    try {
      await addSchedule({
        interviewer_id: interviewerId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled"
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
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Interactive Scheduling</h1>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-5 w-5" />
            <span>Click and drag to schedule multiple slots</span>
          </div>
        </div>
        
        {/* Date Navigator */}
        <DateNavigator 
          currentDate={currentDate}
          onDateChange={handleDateChange}
          onResetToToday={resetToToday}
        />
        
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">Loading...</h3>
          </div>
        ) : interviewers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewers Found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Daily Schedule for {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h2>
            </div>
            
            <InteractiveScheduleGrid
              currentDate={currentDate}
              interviewers={interviewers}
              schedules={schedules}
              sessions={sessions}
              onScheduleSlot={handleScheduleSlot}
              onUnscheduleSlot={handleUnscheduleSlot}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InteractiveScheduling;
