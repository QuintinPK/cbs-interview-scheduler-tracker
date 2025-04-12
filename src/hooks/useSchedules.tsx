
import { useState } from "react";
import { Schedule, Interviewer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { format } from "date-fns";

export const useSchedules = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const fetchSchedules = async (interviewerId?: string, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('schedules')
        .select(`
          id,
          interviewer_id,
          project_id,
          start_time,
          end_time,
          status,
          notes
        `);
      
      if (interviewerId) {
        query = query.eq('interviewer_id', interviewerId);
      }
      
      if (startDate && endDate) {
        query = query
          .gte('start_time', startDate)
          .lte('end_time', endDate);
      }
      
      const { data, error } = await query.order('start_time', { ascending: true });
      
      if (error) throw error;
      
      setSchedules(data as Schedule[]);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast({
        title: "Error",
        description: "Could not fetch schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const addSchedule = async (schedule: Omit<Schedule, "id">) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert([schedule])
        .select();
        
      if (error) throw error;
      
      setSchedules(prev => [...prev, data[0] as Schedule]);
      
      toast({
        title: "Success",
        description: "Schedule added successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Could not add schedule",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateSchedule = async (id: string, schedule: Omit<Schedule, "id">) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('schedules')
        .update(schedule)
        .eq('id', id);
        
      if (error) throw error;
      
      setSchedules(prev => 
        prev.map(s => s.id === id ? { ...schedule, id } as Schedule : s)
      );
      
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Could not update schedule",
        variant: "destructive",
      });
      return false;
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
      
      setSchedules(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Could not delete schedule",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getScheduleForInterviewer = async (
    interviewerId: string, 
    date: Date
  ): Promise<Schedule[]> => {
    try {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`)
        .order('start_time');
        
      if (error) throw error;
      
      return data as Schedule[];
    } catch (error) {
      console.error("Error fetching interviewer schedule:", error);
      return [];
    }
  };

  return {
    schedules,
    loading,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleForInterviewer
  };
};
