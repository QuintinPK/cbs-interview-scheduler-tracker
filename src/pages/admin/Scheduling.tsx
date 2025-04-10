
import React, { useState, useCallback, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useInterviewers } from "@/hooks/useInterviewers";
import ScheduleGrid from "@/components/scheduling/ScheduleGrid";
import ScheduleDialog from "@/components/scheduling/ScheduleDialog";
import WeekNavigator from "@/components/scheduling/WeekNavigator";
import DeleteDialog from "@/components/scheduling/DeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Scheduling: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  
  const { toast } = useToast();
  const { interviewers } = useInterviewers();
  
  const { 
    schedules,
    currentWeekDays, 
    timeslots, 
    currentWeek, 
    isLoading,
    setCurrentWeek,
    refetchSchedules
  } = useSchedules();

  // Handlers for dialog interactions
  const handleShowDialog = useCallback(() => {
    setSelectedSchedule(null);
    setShowDialog(true);
  }, []);

  const handleCellSelect = useCallback((interviewerId: string, day: string, timeslot: string) => {
    // Check if a schedule exists for this cell
    const existingSchedule = schedules.find(
      s => s.interviewer_id === interviewerId && s.day === day && s.timeslot === timeslot
    );
    
    if (existingSchedule) {
      setSelectedSchedule(existingSchedule);
      setShowDeleteDialog(true);
    } else {
      setSelectedSchedule({
        interviewer_id: interviewerId,
        day,
        timeslot
      });
      setShowDialog(true);
    }
  }, [schedules]);

  const handleClose = useCallback(() => {
    setShowDialog(false);
    setShowDeleteDialog(false);
  }, []);

  // Memoize the processed schedules to prevent unnecessary re-renders
  const processedSchedules = useMemo(() => {
    return schedules.map(schedule => ({
      id: schedule.id,
      interviewer_id: schedule.interviewer_id,
      day: schedule.day,
      timeslot: schedule.timeslot,
      status: schedule.status
    }));
  }, [schedules]);

  // Handle delete schedule
  const handleDeleteSchedule = useCallback(async () => {
    if (!selectedSchedule?.id) return;
    
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', selectedSchedule.id);
        
      if (error) throw error;
      
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully."
      });
      
      refetchSchedules();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedSchedule, refetchSchedules, toast]);

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
          currentWeek={currentWeek} 
          setCurrentWeek={setCurrentWeek} 
        />
        
        {isLoading ? (
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
        onClose={handleClose}
        selectedSchedule={selectedSchedule}
        interviewers={interviewers}
        onSuccess={refetchSchedules}
      />
      
      {/* Delete Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={handleClose}
        onDelete={handleDeleteSchedule}
      />
    </AdminLayout>
  );
};

export default Scheduling;
