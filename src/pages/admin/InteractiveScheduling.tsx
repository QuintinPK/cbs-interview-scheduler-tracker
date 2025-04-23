
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useSessions } from "@/hooks/useSessions";
import { format, startOfDay, endOfDay } from "date-fns";
import { InteractiveScheduleGrid } from "@/components/scheduling/InteractiveScheduleGrid";
import { DateNavigator } from "@/components/scheduling/DateNavigator";
import { Calendar } from "lucide-react";

const InteractiveScheduling = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get interviewers data
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  
  // Format the date for API calls
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  
  // Get schedules for all interviewers for the current day
  const { 
    schedules, 
    loading: schedulesLoading,
    addSchedule,
    deleteSchedule,
    refresh: refreshSchedules
  } = useSchedules(undefined, formattedDate, formattedDate);
  
  // Get sessions for all interviewers for the current day
  const {
    sessions,
    loading: sessionsLoading
  } = useSessions(
    undefined,
    formattedDate,
    formattedDate
  );
  
  // Combined loading state
  const isLoading = interviewersLoading || schedulesLoading || sessionsLoading || loading;
  
  // Initialize with interviewer from URL if provided
  useEffect(() => {
    const interviewerFromUrl = searchParams.get("interviewer");
    if (interviewerFromUrl) {
      // Could filter by interviewer if needed
    }
  }, [searchParams]);
  
  // Handle scheduling a time slot
  const handleScheduleSlot = async (interviewerId: string, startTime: Date, endTime: Date) => {
    try {
      setLoading(true);
      
      await addSchedule({
        interviewer_id: interviewerId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "scheduled"
      });
      
      toast({
        title: "Success",
        description: "Slot scheduled successfully",
      });
    } catch (error) {
      console.error("Error scheduling slot:", error);
      toast({
        title: "Error",
        description: "Could not schedule slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle unscheduling a time slot
  const handleUnscheduleSlot = async (scheduleId: string) => {
    try {
      setLoading(true);
      
      await deleteSchedule(scheduleId);
      
      toast({
        title: "Success",
        description: "Slot unscheduled successfully",
      });
    } catch (error) {
      console.error("Error unscheduling slot:", error);
      toast({
        title: "Error",
        description: "Could not unschedule slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <p className="text-muted-foreground">
              Please wait while we load the schedule data.
            </p>
          </div>
        ) : interviewers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewers Found</h3>
            <p className="text-muted-foreground">
              Please add interviewers to view and manage schedules.
            </p>
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
