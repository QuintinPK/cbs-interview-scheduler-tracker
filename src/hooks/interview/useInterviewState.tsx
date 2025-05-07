
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Interview } from "@/types";

/**
 * Hook for managing interview state (active interview, loading state, etc.)
 */
export const useInterviewState = (sessionId: string | null) => {
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const fetchActiveInterview = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setIsInterviewLoading(true);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        // With the DB update, candidate_name should now be present in the data
        const interview: Interview = {
          ...data,
          candidate_name: data.candidate_name || "Unknown"
        };
        setActiveInterview(interview);
      } else {
        setActiveInterview(null);
      }
    } catch (error) {
      console.error("Error fetching active interview:", error);
    } finally {
      setIsInterviewLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (sessionId) {
      fetchActiveInterview(sessionId);
    } else {
      setActiveInterview(null);
    }
  }, [sessionId, fetchActiveInterview]);

  return {
    activeInterview,
    setActiveInterview,
    isInterviewLoading,
    setIsInterviewLoading,
    showResultDialog,
    setShowResultDialog,
    fetchActiveInterview
  };
};
