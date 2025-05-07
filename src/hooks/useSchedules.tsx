import { useState, useEffect, useCallback } from "react";
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
  
  const loadSchedules = useCallback(async () => {
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
      
      // Convert data to proper Schedule objects and ensure consistent "canceled" spelling
      const formattedSchedules: Schedule[] = (data || []).map(schedule => ({
        id: schedule.id,
        interviewer_id: schedule.interviewer_id,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        // Convert "cancelled" to "canceled" for consistency
        status: schedule.status === "cancelled" ? "canceled" as const : schedule.status as 'scheduled' | 'completed' | 'canceled',
        notes: schedule.notes || undefined,
        project_id: schedule.project_id
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
  }, [interviewerId, startDate, endDate, toast]);

  // Initial load and setup realtime subscriptions
  useEffect(() => {
    loadSchedules();
    
    // Set up real-time listener for schedule changes
    const channel = supabase
      .channel('schedules_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedules',
        filter: interviewerId ? `interviewer_id=eq.${interviewerId}` : undefined
      }, payload => {
        // Verify this change is relevant to our current date filter
        const isRelevantDate = checkIfScheduleIsInDateRange(
          payload.new || payload.old, 
          startDate, 
          endDate
        );
        
        if (!isRelevantDate) return;
        
        if (payload.eventType === 'INSERT') {
          setSchedules(current => [...current, formatScheduleData(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setSchedules(current => 
            current.map(schedule => 
              schedule.id === payload.new.id ? formatScheduleData(payload.new) : schedule
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setSchedules(current => 
            current.filter(schedule => schedule.id !== payload.old.id)
          );
        }
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error("Failed to subscribe to schedules changes:", status);
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewerId, startDate, endDate, loadSchedules]);

  // Helper to check if schedule is within date range
  const checkIfScheduleIsInDateRange = (
    scheduleData: any, 
    startDate?: string, 
    endDate?: string
  ): boolean => {
    if (!scheduleData?.start_time) return false;
    
    const scheduleDate = parseISO(scheduleData.start_time);
    const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
    
    // Check date range
    if ((startDate && scheduleDateStr < startDate) || 
        (endDate && scheduleDateStr > endDate)) {
      return false;
    }
    
    return true;
  };

  // Helper to consistently format schedule data from realtime events
  const formatScheduleData = (data: any): Schedule => ({
    id: data.id,
    interviewer_id: data.interviewer_id,
    start_time: data.start_time,
    end_time: data.end_time,
    // Convert "cancelled" to "canceled" for consistency
    status: data.status === "cancelled" ? "canceled" as const : data.status as 'scheduled' | 'completed' | 'canceled',
    notes: data.notes || undefined,
    project_id: data.project_id
  });

  const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert([schedule]);
        
      if (error) throw error;
      
      // Real-time subscription will handle updating state
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      
      return true;
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

  const updateSchedule = async (id: string, schedule: Partial<Omit<Schedule, 'id'>>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update(schedule)
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      
      // Real-time subscription will handle updating state
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Could not update schedule",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      
      // Real-time subscription will handle updating state
      return true;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Could not delete schedule",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getScheduledHoursForWeek = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Filter schedules for the given week that are not canceled
    const weekSchedules = schedules.filter(schedule => {
      const scheduleDate = parseISO(schedule.start_time);
      return (
        scheduleDate >= weekStart && 
        scheduleDate <= weekEnd && 
        schedule.status !== 'canceled'
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
