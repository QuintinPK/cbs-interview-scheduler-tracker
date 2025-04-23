import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Schedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, parseISO, differenceInHours } from "date-fns";

export const useSchedules = (
  interviewerId?: string,
  startDate?: string,
  endDate?: string
) => {
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
      
      if (startDate) {
        query = query.gte('start_time', `${startDate}T00:00:00`);
      }
      
      if (endDate) {
        query = query.lte('start_time', `${endDate}T23:59:59`);
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
  }, [interviewerId, startDate, endDate]);

  const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert([schedule]);
        
      if (error) throw error;
      
      return await loadSchedules();
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Could not add schedule",
        variant: "destructive",
      });
      throw error;
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

  const getScheduledHoursForWeek = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Filter schedules for the given week that are not cancelled
    const weekSchedules = schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.start_time);
      return (
        scheduleDate >= weekStart && 
        scheduleDate <= weekEnd && 
        schedule.status !== 'cancelled'
      );
    });
    
    // Calculate total hours
    return weekSchedules.reduce((total, schedule) => {
      const start = parseISO(schedule.start_time);
      const end = parseISO(schedule.end_time);
      const hours = differenceInHours(end, start);
      return total + hours;
    }, 0);
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduledHoursForWeek,
    refresh: loadSchedules
  };
};
