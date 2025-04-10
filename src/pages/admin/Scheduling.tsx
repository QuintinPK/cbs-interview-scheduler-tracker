
import React, { useState, useCallback, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useInterviewers } from "@/hooks/useInterviewers";
import ScheduleGrid from "@/components/scheduling/ScheduleGrid";
import { ScheduleDialog } from "@/components/scheduling/ScheduleDialog";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";
import { DeleteDialog } from "@/components/scheduling/DeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { DateRange } from "react-day-picker";

const Scheduling: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // For schedule dialog state
  const [selectedInterviewerCode, setSelectedInterviewerCode] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  
  const { toast } = useToast();
  const { interviewers } = useInterviewers();
  const { schedules, loading, addSchedule, deleteSchedule, refresh: refetchSchedules } = useSchedules();

  // Generate array of days for the current week
  const currentWeekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(currentWeekStart, i), 'yyyy-MM-dd'));
    }
    return days;
  }, [currentWeekStart]);

  // Generate array of timeslots
  const timeslots = useMemo(() => {
    return [
      "09:00", "10:00", "11:00", "12:00", "13:00", 
      "14:00", "15:00", "16:00", "17:00"
    ];
  }, []);

  // Process schedules to add day and timeslot properties for the ScheduleGrid
  const processedSchedules = useMemo(() => {
    return schedules.map(schedule => ({
      id: schedule.id,
      interviewer_id: schedule.interviewer_id,
      day: format(new Date(schedule.start_time), 'yyyy-MM-dd'),
      timeslot: format(new Date(schedule.start_time), 'HH:mm'),
      status: schedule.status
    }));
  }, [schedules]);

  // Handle week navigation
  const handleWeekChange = useCallback((newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  }, []);

  const handleResetToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  // Handlers for dialog interactions
  const handleShowDialog = useCallback(() => {
    setSelectedSchedule(null);
    setDateRange(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setStatus("scheduled");
    setSelectedInterviewerCode("");
    setShowDialog(true);
  }, []);

  const handleCellSelect = useCallback((interviewerId: string, day: string, timeslot: string) => {
    // Find the interviewer code
    const interviewer = interviewers.find(i => i.id === interviewerId);
    
    // Check if a schedule exists for this cell
    const existingSchedule = processedSchedules.find(
      s => s.interviewer_id === interviewerId && s.day === day && s.timeslot === timeslot
    );
    
    if (existingSchedule) {
      setSelectedSchedule(existingSchedule);
      setShowDeleteDialog(true);
    } else {
      const scheduleDate = new Date(`${day}T${timeslot}`);
      
      setSelectedSchedule({
        interviewer_id: interviewerId,
        day,
        timeslot
      });
      
      // Set form state
      if (interviewer) {
        setSelectedInterviewerCode(interviewer.code);
      }
      
      setDateRange({
        from: scheduleDate,
        to: scheduleDate
      });
      
      setStartTime(timeslot);
      setEndTime(format(new Date(scheduleDate.getTime() + 60 * 60 * 1000), 'HH:mm')); // 1 hour later
      setStatus("scheduled");
      
      setShowDialog(true);
    }
  }, [interviewers, processedSchedules]);

  const handleDialogClose = useCallback(() => {
    setShowDialog(false);
    setShowDeleteDialog(false);
  }, []);

  // Handle delete schedule
  const handleDeleteSchedule = useCallback(async () => {
    if (!selectedSchedule?.id) return;
    
    try {
      await deleteSchedule(selectedSchedule.id);
      
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully."
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedSchedule, deleteSchedule, toast]);

  // Handle submit schedule
  const handleSubmitSchedule = useCallback(async () => {
    if (!dateRange?.from || !selectedInterviewerCode) return;
    
    try {
      const interviewer = interviewers.find(i => i.code === selectedInterviewerCode);
      if (!interviewer) {
        throw new Error("Interviewer not found");
      }
      
      const startDateTime = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dateRange.from.getDate(),
        parseInt(startTime.split(':')[0]),
        parseInt(startTime.split(':')[1])
      );
      
      const endDateTime = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dateRange.from.getDate(),
        parseInt(endTime.split(':')[0]),
        parseInt(endTime.split(':')[1])
      );
      
      await addSchedule({
        interviewer_id: interviewer.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: status
      });
      
      toast({
        title: "Schedule added",
        description: "The schedule has been added successfully."
      });
      
      setShowDialog(false);
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Failed to add schedule. Please try again.",
        variant: "destructive"
      });
    }
  }, [dateRange, selectedInterviewerCode, startTime, endTime, status, addSchedule, interviewers, toast]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Scheduling</h1>
          <Button onClick={handleShowDialog} className="bg-cbs hover:bg-cbs-light">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
        
        <WeekNavigator 
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          onResetToCurrentWeek={handleResetToCurrentWeek}
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cbs"></div>
          </div>
        ) : (
          <ScheduleGrid
            days={currentWeekDays}
            timeslots={timeslots}
            interviewers={interviewers}
            schedules={processedSchedules}
            onCellSelect={handleCellSelect}
          />
        )}
      </div>
      
      {/* Schedule Dialog */}
      <ScheduleDialog
        open={showDialog}
        onOpenChange={handleDialogClose}
        isEditing={false}
        selectedSchedule={selectedSchedule}
        selectedInterviewer={interviewers.find(i => i.code === selectedInterviewerCode)}
        selectedInterviewerCode={selectedInterviewerCode}
        interviewers={interviewers}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        status={status}
        setStatus={setStatus}
        onSubmit={handleSubmitSchedule}
      />
      
      {/* Delete Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={handleDialogClose}
        selectedSchedule={selectedSchedule}
        interviewers={interviewers}
        onConfirmDelete={handleDeleteSchedule}
      />
    </AdminLayout>
  );
};

export default Scheduling;
