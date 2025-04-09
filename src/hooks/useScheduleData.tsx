
import { useState, useEffect } from "react";
import { Schedule } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useScheduleData = (interviewerId?: string) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!interviewerId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('interviewer_id', interviewerId);
          
        if (error) throw error;
        
        // Convert raw data to Schedule type with proper status typing
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
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedules();
  }, [interviewerId]);
  
  return { schedules, loading };
};
