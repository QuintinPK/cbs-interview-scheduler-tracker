
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Schedule } from '@/types';

export const useScheduleOperations = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Add a single schedule
  const addSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert([schedule])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Schedule added successfully",
      });
      
      return data as Schedule;
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast({
        title: "Error",
        description: "Could not add schedule",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Add multiple schedules in batch
  const addSchedulesBatch = async (schedules: Omit<Schedule, 'id'>[]) => {
    if (schedules.length === 0) return [];
    
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert(schedules)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${schedules.length} slots scheduled successfully`,
      });
      
      return data as Schedule[];
    } catch (error) {
      console.error("Error batch adding schedules:", error);
      toast({
        title: "Error",
        description: "Could not schedule time slots",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a single schedule
  const deleteSchedule = async (id: string) => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Delete multiple schedules in batch
  const deleteSchedulesBatch = async (ids: string[]) => {
    if (ids.length === 0) return true;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${ids.length} slots unscheduled successfully`,
      });
      
      return true;
    } catch (error) {
      console.error("Error batch deleting schedules:", error);
      toast({
        title: "Error",
        description: "Could not unschedule time slots",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    addSchedule,
    addSchedulesBatch,
    deleteSchedule,
    deleteSchedulesBatch
  };
};
