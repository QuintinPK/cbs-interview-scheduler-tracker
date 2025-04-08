
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, parseISO, differenceInHours } from "date-fns";

export const useInterviewerWorkHours = (interviewerId?: string) => {
  const { toast } = useToast();
  const [workedHours, setWorkedHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const calculateWorkHoursForWeek = async (weekStart: Date) => {
    if (!interviewerId) {
      setWorkedHours(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Convert to ISO strings for the query
      const startDate = weekStart.toISOString();
      const endDate = weekEnd.toISOString();
      
      // Query sessions for the selected interviewer in the given week
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('interviewer_id', interviewerId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .not('end_time', 'is', null);
        
      if (error) throw error;
      
      // Calculate total worked hours
      let totalHours = 0;
      
      for (const session of data || []) {
        const start = parseISO(session.start_time);
        const end = parseISO(session.end_time);
        const hours = differenceInHours(end, start);
        totalHours += hours;
      }
      
      setWorkedHours(totalHours);
    } catch (error) {
      console.error("Error calculating work hours:", error);
      toast({
        title: "Error",
        description: "Could not calculate worked hours",
        variant: "destructive",
      });
      setWorkedHours(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    workedHours,
    loading,
    calculateWorkHoursForWeek
  };
};
