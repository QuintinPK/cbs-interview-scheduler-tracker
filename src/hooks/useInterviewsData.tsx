
import { useState } from "react";
import { Interview } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useInterviewsData = () => {
  const { toast } = useToast();
  
  const getSessionInterviews = async (sessionId: string): Promise<Interview[]> => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching interviews for session:", error);
      toast({
        title: "Error",
        description: "Could not fetch interview data",
        variant: "destructive",
      });
      return [];
    }
  };
  
  const getSessionInterviewsCount = async (sessionId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching interview count for session:", error);
      return 0;
    }
  };
  
  return {
    getSessionInterviews,
    getSessionInterviewsCount
  };
};

export default useInterviewsData;
