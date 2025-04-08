
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Interviewer, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { CalendarWithTime } from "@/components/ui/calendar-with-time";
import { 
  format, 
  parseISO, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  differenceInDays,
  isEqual,
  isSameDay
} from "date-fns";
import { PlusCircle, ArrowLeft, ArrowRight, Pencil, Trash2, Calendar } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useInterviewers } from "@/hooks/useInterviewers";

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
  
  // Use the custom hooks to fetch data
  const { interviewers, loading: interviewersLoading } = useInterviewers();
  const selectedInterviewer = interviewers.find(i => i.code === selectedInterviewerCode);
  const { 
    schedules, 
    loading: schedulesLoading, 
    addSchedule, 
    updateSchedule, 
    deleteSchedule 
  } = useSchedules(selectedInterviewer?.id);
  
  const loading = interviewersLoading || schedulesLoading;
  
  useEffect(() => {
    const interviewerFromUrl = searchParams.get("interviewer");
    if (interviewerFromUrl) {
      setSelectedInterviewerCode(interviewerFromUrl);
    }
  }, [searchParams]);
  
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
    
    // If we're editing, just update the existing schedule
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
    
    // If we're adding a new schedule, handle date range
    try {
      // If no end date or if start and end dates are the same, just create one schedule
      if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
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
        // Create schedules for each day in the range
        const days = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to
        });
        
        // Use Promise.all to create all schedules in parallel
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
    } catch (error) {
      console.error("Error saving schedules:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the schedules",
        variant: "destructive",
      });
    }
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
  
  const prevWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, -7));
  };
  
  const nextWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7));
  };
  
  const resetToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });
  
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  
  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.start_time);
      return (
        scheduleDate.getDate() === day.getDate() &&
        scheduleDate.getMonth() === day.getMonth() &&
        scheduleDate.getFullYear() === day.getFullYear()
      );
    });
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
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="max-w-md">
            <Label htmlFor="interviewer-select">Select Interviewer</Label>
            <Select
              value={selectedInterviewerCode}
              onValueChange={setSelectedInterviewerCode}
            >
              <SelectTrigger id="interviewer-select" className="mt-1">
                <SelectValue placeholder="Select an interviewer" />
              </SelectTrigger>
              <SelectContent>
                {interviewers.map((interviewer) => (
                  <SelectItem key={interviewer.id} value={interviewer.code}>
                    {interviewer.code} - {interviewer.first_name} {interviewer.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={prevWeek}>
              <ArrowLeft size={16} className="mr-1" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <h2 className="font-medium text-lg">
                {format(currentWeekStart, "MMMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMMM d, yyyy")}
              </h2>
              <Button variant="link" onClick={resetToCurrentWeek} className="text-cbs">
                <Calendar size={14} className="mr-1" />
                Current Week
              </Button>
            </div>
            
            <Button variant="outline" onClick={nextWeek}>
              Next Week
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
        
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
            
            <div className="overflow-x-auto">
              <div className="min-w-[768px]">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2 text-center font-medium border-r">Hour</div>
                  {weekDays.map((day, index) => (
                    <div 
                      key={index} 
                      className={`p-2 text-center font-medium ${
                        format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") 
                          ? "bg-cbs/10" 
                          : ""
                      }`}
                    >
                      <div>{format(day, "EEE")}</div>
                      <div className="text-sm">{format(day, "MMM d")}</div>
                    </div>
                  ))}
                </div>
                
                <div className="relative">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b">
                      <div className="p-2 text-center text-sm font-medium border-r">
                        {hour}:00
                      </div>
                      
                      {weekDays.map((day, dayIndex) => {
                        const daySchedules = getSchedulesForDay(day);
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className={`p-2 min-h-[80px] relative ${
                              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") 
                                ? "bg-cbs/5" 
                                : ""
                            }`}
                          >
                            {daySchedules.map((schedule) => {
                              const start = parseISO(schedule.start_time);
                              const end = parseISO(schedule.end_time);
                              const startHour = start.getHours();
                              const endHour = end.getHours();
                              
                              if (hour >= startHour && hour < endHour) {
                                return (
                                  <div 
                                    key={schedule.id}
                                    className={`absolute inset-x-1 p-1 rounded-md text-xs ${
                                      schedule.status === "completed" 
                                        ? "bg-green-100 border border-green-300"
                                        : schedule.status === "cancelled"
                                          ? "bg-gray-100 border border-gray-300 opacity-60"
                                          : "bg-cbs-light/20 border border-cbs-light/40"
                                    }`}
                                    style={{
                                      top: "4px",
                                      minHeight: "72px"
                                    }}
                                  >
                                    <div className="font-medium">
                                      {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                    </div>
                                    <div className="mt-1 flex justify-between">
                                      <span className="text-xs">{schedule.status}</span>
                                      <div className="flex space-x-1">
                                        <button 
                                          onClick={() => handleEdit(schedule)}
                                          className="text-cbs hover:text-cbs-light"
                                        >
                                          <Pencil size={10} />
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(schedule)}
                                          className="text-destructive hover:text-destructive/70"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
      
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Interviewer</Label>
              <Select
                value={selectedInterviewerCode}
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interviewers.map((interviewer) => (
                    <SelectItem key={interviewer.id} value={interviewer.code}>
                      {interviewer.code} - {interviewer.first_name} {interviewer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <CalendarWithTime
              selectedRange={dateRange}
              onRangeChange={setDateRange}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: "scheduled" | "completed" | "cancelled") => setStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-cbs hover:bg-cbs-light">
              {isEditing ? "Save Changes" : "Add Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to delete this schedule for{" "}
              {selectedSchedule && interviewers.find(i => i.id === selectedSchedule.interviewer_id)?.first_name}{" "}
              {selectedSchedule && interviewers.find(i => i.id === selectedSchedule.interviewer_id)?.last_name}?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Scheduling;
