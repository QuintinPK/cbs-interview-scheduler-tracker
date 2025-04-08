
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { mockInterviewers } from "@/lib/mock-data";
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
import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { PlusCircle, ArrowLeft, ArrowRight, Pencil, Trash2, Calendar } from "lucide-react";

const Scheduling = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedInterviewerCode, setSelectedInterviewerCode] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Form state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  
  // Get interviewerCode from URL if available
  useEffect(() => {
    const interviewerFromUrl = searchParams.get("interviewer");
    if (interviewerFromUrl) {
      setSelectedInterviewerCode(interviewerFromUrl);
    }
  }, [searchParams]);
  
  // Generate mock schedules for the selected interviewer
  useEffect(() => {
    if (selectedInterviewerCode) {
      // For demo purposes, generate some random schedules
      const mockSchedules: Schedule[] = [];
      
      // Generate schedules for the current week
      const daysInWeek = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
      });
      
      // Add 2-3 schedules for the selected interviewer
      for (let i = 0; i < 3; i++) {
        const randomDayIndex = Math.floor(Math.random() * daysInWeek.length);
        const day = daysInWeek[randomDayIndex];
        
        mockSchedules.push({
          id: `schedule-${i}`,
          interviewerCode: selectedInterviewerCode,
          startTime: new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            9 + Math.floor(Math.random() * 3),
            0
          ).toISOString(),
          endTime: new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            14 + Math.floor(Math.random() * 3),
            0
          ).toISOString(),
          status: Math.random() > 0.7 ? "completed" : "scheduled",
        });
      }
      
      setSchedules(mockSchedules);
    } else {
      setSchedules([]);
    }
  }, [selectedInterviewerCode, currentWeekStart]);
  
  const handleAddNew = () => {
    if (!selectedInterviewerCode) {
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
    
    const startDate = parseISO(schedule.startTime);
    const endDate = parseISO(schedule.endTime);
    
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
  
  const handleSubmit = () => {
    if (!dateRange?.from || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please select dates and times",
        variant: "destructive",
      });
      return;
    }
    
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    
    const startDateTime = new Date(dateRange.from);
    startDateTime.setHours(startHours, startMinutes);
    
    const endDateTime = new Date(dateRange.to || dateRange.from);
    endDateTime.setHours(endHours, endMinutes);
    
    if (isEditing && selectedSchedule) {
      // Update existing schedule
      const updatedSchedules = schedules.map((schedule) => {
        if (schedule.id === selectedSchedule.id) {
          return {
            ...schedule,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            status,
          };
        }
        return schedule;
      });
      
      setSchedules(updatedSchedules);
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    } else {
      // Add new schedule
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        interviewerCode: selectedInterviewerCode,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status,
      };
      
      setSchedules([...schedules, newSchedule]);
      toast({
        title: "Success",
        description: "New schedule added successfully",
      });
    }
    
    setShowAddEditDialog(false);
  };
  
  const confirmDelete = () => {
    if (!selectedSchedule) return;
    
    const updatedSchedules = schedules.filter(
      (schedule) => schedule.id !== selectedSchedule.id
    );
    
    setSchedules(updatedSchedules);
    setShowDeleteDialog(false);
    
    toast({
      title: "Success",
      description: "Schedule deleted successfully",
    });
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
  
  // Generate days for the week view
  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });
  
  // Hours for the calendar
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
  
  // Get schedules for a specific day
  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.startTime);
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
        
        {/* Interviewer Selection */}
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
                {mockInterviewers.map((interviewer) => (
                  <SelectItem key={interviewer.id} value={interviewer.code}>
                    {interviewer.code} - {interviewer.firstName} {interviewer.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Week Navigation */}
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
        
        {selectedInterviewerCode ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Weekly Schedule for{" "}
                {mockInterviewers.find(i => i.code === selectedInterviewerCode)?.firstName || ""}{" "}
                {mockInterviewers.find(i => i.code === selectedInterviewerCode)?.lastName || ""}
              </h2>
            </div>
            
            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[768px]">
                {/* Day Headers */}
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
                
                {/* Hour Rows */}
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
                              const start = parseISO(schedule.startTime);
                              const end = parseISO(schedule.endTime);
                              const startHour = start.getHours();
                              const endHour = end.getHours();
                              
                              // Only show if this schedule starts or includes this hour
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
      
      {/* Add/Edit Dialog */}
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
                  {mockInterviewers.map((interviewer) => (
                    <SelectItem key={interviewer.id} value={interviewer.code}>
                      {interviewer.code} - {interviewer.firstName} {interviewer.lastName}
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to delete this schedule for{" "}
              {selectedSchedule && mockInterviewers.find(i => i.code === selectedSchedule.interviewerCode)?.firstName}{" "}
              {selectedSchedule && mockInterviewers.find(i => i.code === selectedSchedule.interviewerCode)?.lastName}?
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
