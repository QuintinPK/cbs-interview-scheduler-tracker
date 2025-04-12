import React, { useState, useEffect } from "react";
import { addDays, format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import AdminLayout from "@/components/layout/AdminLayout";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useSchedules } from "@/hooks/useSchedules";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";
import { Interviewer, Schedule } from "@/types";
import { ScheduleGrid } from "@/components/scheduling/ScheduleGrid";
import { InterviewerSelector } from "@/components/scheduling/InterviewerSelector";
import { WeekNavigator } from "@/components/scheduling/WeekNavigator";
import { ScheduleDialog } from "@/components/scheduling/ScheduleDialog";
import { DeleteDialog } from "@/components/scheduling/DeleteDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import IslandSelector from "@/components/projects/IslandSelector";
import { Island } from "@/types";

const Scheduling = () => {
  const { toast } = useToast();
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const { schedules, fetchSchedules, addSchedule, updateSchedule, deleteSchedule, loading: schedulesLoading } = useSchedules();
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | undefined>(undefined);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInterviewers, setFilteredInterviewers] = useState<Interviewer[]>([]);
  
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const { projects } = useProjects(selectedIsland);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  useEffect(() => {
    if (interviewers.length > 0) {
      setFilteredInterviewers(interviewers);
      if (!selectedInterviewer) {
        setSelectedInterviewer(interviewers[0]);
      }
    }
  }, [interviewers]);
  
  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredInterviewers(
        interviewers.filter(
          (interviewer) =>
            interviewer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${interviewer.first_name} ${interviewer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredInterviewers(interviewers);
    }
  }, [searchTerm, interviewers]);
  
  useEffect(() => {
    if (selectedInterviewer) {
      fetchSchedules(
        selectedInterviewer.id,
        format(startOfDay(weekStart), "yyyy-MM-dd'T'HH:mm:ss"),
        format(endOfDay(weekEnd), "yyyy-MM-dd'T'HH:mm:ss")
      );
    }
  }, [selectedInterviewer, weekStart, weekEnd]);
  
  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
    setWeekEnd(addDays(weekEnd, -7));
  };
  
  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
    setWeekEnd(addDays(weekEnd, 7));
  };
  
  const handleCurrentWeek = () => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setWeekStart(currentWeekStart);
    setWeekEnd(endOfWeek(currentWeekStart, { weekStartsOn: 1 }));
  };
  
  const handleAddSchedule = () => {
    if (!selectedInterviewer) {
      toast({
        title: "Error",
        description: "Please select an interviewer",
        variant: "destructive",
      });
      return;
    }
    
    setDateRange(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setStatus("scheduled");
    setSelectedProjectId(null);
    setIsAddDialogOpen(true);
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDateRange({
      from: parseISO(schedule.start_time),
      to: parseISO(schedule.end_time),
    });
    setStartTime(format(parseISO(schedule.start_time), "HH:mm"));
    setEndTime(format(parseISO(schedule.end_time), "HH:mm"));
    setStatus(schedule.status as "scheduled" | "completed" | "cancelled");
    setSelectedProjectId(schedule.project_id);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };
  
  const handleAddSubmit = async () => {
    if (!selectedInterviewer || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Please select an interviewer and date range",
        variant: "destructive",
      });
      return;
    }
    
    const start = new Date(dateRange.from);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    start.setHours(startHour, startMinute);
    
    const end = new Date(dateRange.to);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    end.setHours(endHour, endMinute);
    
    const scheduleData: Omit<Schedule, "id"> = {
      interviewer_id: selectedInterviewer.id,
      project_id: selectedProjectId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status,
      notes: "",
    };
    
    const success = await addSchedule(scheduleData);
    
    if (success) {
      setIsAddDialogOpen(false);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!selectedInterviewer || !dateRange?.from || !dateRange?.to || !selectedSchedule) {
      toast({
        title: "Error",
        description: "Invalid schedule data",
        variant: "destructive",
      });
      return;
    }
    
    const start = new Date(dateRange.from);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    start.setHours(startHour, startMinute);
    
    const end = new Date(dateRange.to);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    end.setHours(endHour, endMinute);
    
    const scheduleData: Omit<Schedule, "id"> = {
      interviewer_id: selectedInterviewer.id,
      project_id: selectedProjectId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status,
      notes: selectedSchedule.notes || "",
    };
    
    const success = await updateSchedule(selectedSchedule.id, scheduleData);
    
    if (success) {
      setIsEditDialogOpen(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedSchedule) return;
    
    const success = await deleteSchedule(selectedSchedule.id);
    
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Scheduling</h1>
          <Button onClick={handleAddSchedule} className="bg-cbs hover:bg-cbs-light">
            Add Schedule
          </Button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <IslandSelector
                selectedIsland={selectedIsland}
                onIslandChange={setSelectedIsland}
                loading={false}
                placeholder="Filter by island"
              />
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search interviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1 border-r pr-4">
              <InterviewerSelector
                interviewers={filteredInterviewers}
                selectedInterviewer={selectedInterviewer}
                onSelectInterviewer={setSelectedInterviewer}
                loading={interviewersLoading}
              />
            </div>
            
            <div className="md:col-span-4">
              <WeekNavigator
                weekStart={weekStart}
                weekEnd={weekEnd}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
              />
              
              <ScheduleGrid
                loading={schedulesLoading}
                schedules={schedules}
                weekStart={weekStart}
                onEditSchedule={handleEditSchedule}
                onDeleteSchedule={handleDeleteSchedule}
              />
            </div>
          </div>
        </div>
      </div>
      
      <ScheduleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        isEditing={false}
        selectedSchedule={null}
        selectedInterviewer={selectedInterviewer}
        selectedInterviewerCode={selectedInterviewer?.code || ""}
        interviewers={interviewers}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        status={status}
        setStatus={setStatus}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onSubmit={handleAddSubmit}
      />
      
      <ScheduleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        isEditing={true}
        selectedSchedule={selectedSchedule}
        selectedInterviewer={selectedInterviewer}
        selectedInterviewerCode={selectedInterviewer?.code || ""}
        interviewers={interviewers}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        status={status}
        setStatus={setStatus}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onSubmit={handleEditSubmit}
      />
      
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
      />
    </AdminLayout>
  );
};

export default Scheduling;
