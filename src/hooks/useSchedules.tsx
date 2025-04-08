
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Schedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useSchedules = (interviewerId?: string) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('schedules')
        .select('*');
        
      if (interviewerId) {
        query = query.eq('interviewer_id', interviewerId);
      }
      
      const { data, error } = await query.order('start_time');
        
      if (error) throw error;
      
      // Convert data to proper Schedule objects
      const formattedSchedules: Schedule[] = (data || []).map(schedule => ({
        id: schedule.id,
        interviewer_id: schedule.interviewer_id,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status as 'scheduled' | 'completed' | 'cancelled',
        notes: schedule.notes || undefined
      }));
      
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("Error loading schedules:", error);
      toast({
        title: "Error",
        description: "Could not load schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [interviewerId, toast]);

  const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('schedules')
        .insert([schedule]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "New schedule added successfully",
      });
      
      await loadSchedules();
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Could not add schedule",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id: string, schedule: Omit<Schedule, 'id'>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('schedules')
        .update(schedule)
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      
      await loadSchedules();
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Could not update schedule",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSchedules(schedules.filter(s => s.id !== id));
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Could not delete schedule",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    refresh: loadSchedules
  };
};
