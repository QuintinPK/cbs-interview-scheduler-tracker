import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { PlusCircle } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useInterviewerWorkHours } from "@/hooks/useInterviewerWorkHours";
import { useSessions } from "@/hooks/useSessions";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";
import { InterviewerSelector } from "@/components/scheduling/InterviewerSelector";
import { ScheduleGrid } from "@/components/scheduling/ScheduleGrid";
import { ScheduleDialog } from "@/components/scheduling/ScheduleDialog";
import { DeleteDialog } from "@/components/scheduling/DeleteDialog";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";

const Scheduling = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedInterviewerCode, setSelectedInterviewerCode] = useState<string>("");
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const selectedInterviewer = interviewers.find(i => i.code === selectedInterviewerCode);
  
  const { 
    schedules, 
    loading: schedulesLoading, 
    addSchedule, 
    updateSchedule, 
    deleteSchedule,
    getScheduledHoursForWeek
  } = useSchedules(selectedInterviewer?.id);
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const { sessions, loading: sessionsLoading } = useSessions(
    selectedInterviewer?.id, 
    format(currentWeekStart, "yyyy-MM-dd"), 
    format(weekEnd, "yyyy-MM-dd")
  );
  
  const { 
    workedHours, 
    loading: workHoursLoading, 
    calculateWorkHoursForWeek 
  } = useInterviewerWorkHours(selectedInterviewer?.id);
  
  const scheduledHours = selectedInterviewer ? getScheduledHoursForWeek(currentWeekStart) : 0;
  
  const loading = interviewersLoading || schedulesLoading || workHoursLoading || sessionsLoading;
  
  useEffect(() => {
    const interviewerFromUrl = searchParams.get("interviewer");
    if (interviewerFromUrl) {
      setSelectedInterviewerCode(interviewerFromUrl);
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (selectedInterviewer) {
      calculateWorkHoursForWeek(currentWeekStart);
    }
  }, [selectedInterviewer, currentWeekStart]);
  
  const handleAddNew = () => {
    if (!selectedInterviewerCode || !selectedInterviewer) {
      toast({
        title: "Error",
        description: "Please select an interviewer first",
        variant: "destructive",
      });
      return;
    }
    
    setIsEditing(false);
    setSelectedSchedule(null);
    setDateRange({
      from: currentWeekStart,
      to: currentWeekStart,
    });
    setStartTime("09:00");
    setEndTime("17:00");
    setStatus("scheduled");
    setShowAddEditDialog(true);
  };
  
  const handleEdit = (schedule: Schedule) => {
    setIsEditing(true);
    setSelectedSchedule(schedule);
    
    const startDate = parseISO(schedule.start_time);
    const endDate = parseISO(schedule.end_time);
    
    setDateRange({
      from: startDate,
      to: startDate,
    });
    
    setStartTime(format(startDate, "HH:mm"));
    setEndTime(format(endDate, "HH:mm"));
    setStatus(schedule.status);
    
    setShowAddEditDialog(true);
  };
  
  const handleDelete = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteDialog(true);
  };
  
  const handleSubmit = async () => {
    if (!dateRange?.from || !startTime || !endTime || !selectedInterviewer) {
      toast({
        title: "Error",
        description: "Please select dates, times and an interviewer",
        variant: "destructive",
      });
      return;
    }
    
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    
    if (isEditing && selectedSchedule) {
      const startDateTime = new Date(dateRange.from);
      startDateTime.setHours(startHours, startMinutes);
      
      const endDateTime = new Date(dateRange.from);
      endDateTime.setHours(endHours, endMinutes);
      
      const scheduleData = {
        interviewer_id: selectedInterviewer.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status,
      };
      
      try {
        await updateSchedule(selectedSchedule.id, scheduleData);
        setShowAddEditDialog(false);
      } catch (error) {
        console.error("Error updating schedule:", error);
      }
      return;
    }
    
    if (!dateRange.to || format(dateRange.from, "yyyy-MM-dd") === format(dateRange.to, "yyyy-MM-dd")) {
      const startDateTime = new Date(dateRange.from);
      startDateTime.setHours(startHours, startMinutes);
      
      const endDateTime = new Date(dateRange.from);
      endDateTime.setHours(endHours, endMinutes);
      
      const scheduleData = {
        interviewer_id: selectedInterviewer.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status,
      };
      
      await addSchedule(scheduleData);
    } else {
      const { eachDayOfInterval, isSameDay } = await import('date-fns');
      
      const days = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      });
      
      await Promise.all(days.map(async (day) => {
        const startDateTime = new Date(day);
        startDateTime.setHours(startHours, startMinutes);
        
        const endDateTime = new Date(day);
        endDateTime.setHours(endHours, endMinutes);
        
        const scheduleData = {
          interviewer_id: selectedInterviewer.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status,
        };
        
        await addSchedule(scheduleData);
      }));
      
      toast({
        title: "Success",
        description: `Created ${days.length} schedules for the selected date range`,
      });
    }
    
    setShowAddEditDialog(false);
  };
  
  const confirmDelete = async () => {
    if (!selectedSchedule) return;
    
    try {
      await deleteSchedule(selectedSchedule.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
    }
  };
  
  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleWeekChange = (newWeekStart: Date) => {
    setCurrentWeekStart(newWeekStart);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Scheduling</h1>
          <Button
            onClick={handleAddNew}
            className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
            disabled={!selectedInterviewerCode}
          >
            <PlusCircle size={16} />
            Add New Schedule
          </Button>
        </div>
        
        <InterviewerSelector 
          interviewers={interviewers}
          selectedInterviewerCode={selectedInterviewerCode}
          onInterviewerChange={setSelectedInterviewerCode}
          scheduledHours={selectedInterviewer ? scheduledHours : undefined}
          workedHours={selectedInterviewer ? workedHours : undefined}
        />
        
        <WeekNavigator 
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          onResetToCurrentWeek={resetToCurrentWeek}
        />
        
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">Loading...</h3>
            <p className="text-muted-foreground">
              Please wait while we load the schedules.
            </p>
          </div>
        ) : selectedInterviewerCode ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Weekly Schedule for{" "}
                {interviewers.find(i => i.code === selectedInterviewerCode)?.first_name || ""}{" "}
                {interviewers.find(i => i.code === selectedInterviewerCode)?.last_name || ""}
              </h2>
            </div>
            
            <ScheduleGrid 
              currentWeekStart={currentWeekStart}
              schedules={schedules}
              sessions={sessions}
              onEditSchedule={handleEdit}
              onDeleteSchedule={handleDelete}
            />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <h3 className="text-lg font-medium mb-2">No Interviewer Selected</h3>
            <p className="text-muted-foreground">
              Please select an interviewer to view and manage their schedule.
            </p>
          </div>
        )}
      </div>
      
      <ScheduleDialog 
        open={showAddEditDialog}
        onOpenChange={setShowAddEditDialog}
        isEditing={isEditing}
        selectedSchedule={selectedSchedule}
        selectedInterviewer={selectedInterviewer}
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
        onSubmit={handleSubmit}
      />
      
      <DeleteDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedSchedule={selectedSchedule}
        interviewers={interviewers}
        onConfirmDelete={confirmDelete}
      />
      
      <ScheduleStats />
    </AdminLayout>
  );
};

export default Scheduling;
